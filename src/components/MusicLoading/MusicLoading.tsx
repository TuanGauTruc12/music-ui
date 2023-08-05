import "./MusicLoading.scss";

const MusicLoading = () => {
  return (
    <div className="music-loading">
      <div className="container">
        <div className="player-img">
          <div className="active skeleton-loading"></div>
        </div>
        <div className="music-description">
          <div className="skeleton-loading"></div>
          <div className="skeleton-loading"></div>
        </div>

        <div className="player-controls">
          <i className="fa-solid fa-backward" title="Previous"></i>
          <i className="fa-solid fa-play play-button" title="Play"></i>
          <i className="fa-solid fa-forward" title="Next"></i>
        </div>
      </div>
    </div>
  );
};

export default MusicLoading;