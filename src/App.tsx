import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Song } from "./Song";
import axios from "./apis/axios";
import ListMusic from "./components/ListMusic/ListMusic";
import { convertMinutesToTime } from "./utils/fn";

function App() {
  const [songs, setSongs] = useState<Array<Song>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicIndex, setMusicIndex] = useState(0);
  const [sourceMusic, setSourceMusic] = useState();
  const [music] = useState(new Audio(sourceMusic));
  const image = useRef<HTMLImageElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const artist = useRef<HTMLDivElement>(null);
  const currentTimeEl = useRef<HTMLDivElement>(null);
  const durationEl = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const playerProgress = useRef<HTMLDivElement>(null);
  const playBtn = useRef<HTMLDivElement>(null);
  const background = useRef<HTMLImageElement>(null);
  const [arrayEncodeID, setArrayEncodeID] = useState<Array<string>>([]);
  const [time, setTime] = useState(0);

  //start call api
  useEffect(() => {
    if (songs.length > 0) {
      axios
        .get(`${import.meta.env.VITE_SERVER}/${songs[musicIndex]?.path}`)
        .then((response) => {
          if (response.data.data["128"]) {
            setSourceMusic(response.data.data["128"]);
          }
        });
      loadMusic(songs[musicIndex]);
    }
  }, [musicIndex, songs]);

  useEffect(() => {
    setIsPlaying(false);

    const idTimeout = setTimeout(() => {
      setIsPlaying(true);
    }, 1000);
    return () => {
      clearTimeout(idTimeout);
    };
  }, [musicIndex]);

  music.addEventListener("timeupdate", (e: Event) => setTime(e.timeStamp));

  useEffect(() => {
    axios.get(`/`).then((value) => {
      const arrayTemp = value.data.items
        .filter(
          (item: { sectionType: string; items: [] }) =>
            item.sectionType === "playlist" && item.items
        )
        .map((item: { items: [] }) => {
          const arrayStringTemp = item.items.map(
            (item: { encodeId: string }) => item.encodeId
          );
          return arrayStringTemp;
        });
      setArrayEncodeID([...new Set([].concat(...arrayTemp))]);
    });
  }, []);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      const promises = arrayEncodeID.map((item) =>
        axios.get(`/playlist/${item}`)
      );
      try {
        const responses = await Promise.all(promises);
        const arrayTemp: Song[] = [];

        responses.forEach((response) => {
          const arrays = response.data.data.song.items;
          if (arrays.length >= 30 && arrays.length <= 50) {
            arrays.forEach(
              (item: {
                encodeId: string;
                duration: number;
                thumbnailM: string;
                artistsNames: string;
                title: string;
              }) => {
                const { encodeId, duration, thumbnailM, artistsNames, title } =
                  item;
                arrayTemp.push(
                  new Song(encodeId, title, thumbnailM, artistsNames, duration)
                );
              }
            );
          }
        });

        setSongs(arrayTemp);
      } catch (error) {
        console.log(error);
      }
    };

    fetchPlaylistData();
  }, [arrayEncodeID]);

  function loadMusic(song: Song) {
    if (song) {
      if (progress.current) {
        progress.current.style.width = `0%`;
      }

      if (
        title.current &&
        artist.current &&
        image.current &&
        background.current &&
        durationEl.current
      ) {
        title.current.textContent =
          song.displayName.length > 30
            ? `${song.displayName.substring(0, 30)}....`
            : song.displayName;
        artist.current.textContent =
          song.artist.length > 35
            ? `${song.artist.substring(0, 35)}....`
            : song.artist;
        image.current.src = song.cover;
        background.current.src = song.cover;
        durationEl.current.textContent = convertMinutesToTime(song.duration);
      }
    }
  }

  useEffect(() => {
    if (sourceMusic) {
      music.src = sourceMusic;
    }
  }, [sourceMusic]);

  useEffect(() => {
    if (!isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [isPlaying]);

  function pauseMusic() {
    if (playBtn.current) {
      playBtn.current.classList.replace("fa-pause", "fa-play");
      playBtn.current.setAttribute("title", "Play");
      music.pause();
    }
  }

  function playMusic() {
    if (playBtn.current) {
      playBtn.current.classList.replace("fa-play", "fa-pause");
      playBtn.current.setAttribute("title", "Pause");
      music.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }

  function changeMusic(direction: number) {
    setMusicIndex((musicIndex + direction + songs.length) % songs.length);
    loadMusic(songs[musicIndex]);
    if (progress.current) {
      progress.current.style.width = "0%";
    }
  }

  useEffect(() => {
    updateProgressBar();
  }, [time]);

  function updateProgressBar() {
    const { currentTime } = music;

    const duration = songs[musicIndex]?.duration;

    if (Math.ceil(currentTime) === duration) {
      setMusicIndex((prev) => ++prev);
    }
    const progressPercent = (currentTime / duration) * 100;
    if (progress.current) {
      progress.current.style.width = `${progressPercent}%`;
    }

    const formatTime = (time: number) =>
      String(Math.floor(time)).padStart(2, "0");

    if (currentTimeEl.current) {
      currentTimeEl.current.textContent = `${formatTime(
        currentTime / 60
      )}:${formatTime(currentTime % 60)}`;
    }

    if (durationEl.current) {
      if (songs[musicIndex]) {
        durationEl.current.textContent = convertMinutesToTime(
          songs[musicIndex]?.duration
        );
      } else {
        durationEl.current.textContent = "00:00";
      }
    }
  }

  function setProgressBar(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (playerProgress.current) {
      const width = playerProgress.current.clientWidth;
      const clickX = e.nativeEvent.offsetX;
      const currentTime = (clickX / width) * music.duration;
      music.currentTime = currentTime;
      setTime(currentTime);
    }
  }

  return (
    <>
      <div className="background">
        <img ref={background} />
      </div>
      <div className="container">
        <div className="player-img">
          <img ref={image} className="active" id="cover" />
        </div>
        <h2 ref={title}></h2>
        <h3 ref={artist}></h3>
        <div
          className="player-progress"
          ref={playerProgress}
          onClick={(e) => setProgressBar(e)}
        >
          <div className="progress" ref={progress}>
            <div className="music-duration">
              <span ref={currentTimeEl}></span>
              <span ref={durationEl}></span>
            </div>
          </div>
        </div>
        <div className="player-controls">
          <i
            className="fa-solid fa-backward"
            onClick={() => changeMusic(-1)}
            title="Previous"
          ></i>
          <i
            ref={playBtn}
            className="fa-solid fa-play play-button"
            onClick={() => setIsPlaying((prev) => !prev)}
            title="Play"
          ></i>
          <i
            className="fa-solid fa-forward"
            onClick={() => changeMusic(1)}
            title="Next"
          ></i>
        </div>
      </div>
      <ListMusic onMusicIndex={setMusicIndex} songs={songs} />
    </>
  );
}

export default App;
