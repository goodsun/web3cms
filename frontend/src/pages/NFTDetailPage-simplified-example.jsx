// 簡素化されたメディアセクションのJSX実装例

const MediaSection = ({ nft, metadata, activeTab }) => {
  const renderMediaContent = () => {
    switch (activeTab) {
      case 'image':
        if (!metadata.image) return null;
        return (
          <img 
            className="media-content" 
            src={metadata.image} 
            alt={metadata.name || `NFT #${nft.tokenId}`} 
          />
        );

      case 'animation':
        if (!metadata.animation_url) return null;
        
        if (is3DContent(metadata.animation_url)) {
          return (
            <>
              <iframe
                className="media-content media-content--iframe"
                src={`https://3d.bon-soleil.com/?src=${encodeURIComponent(metadata.animation_url)}`}
                title="3D Model Viewer"
                allowFullScreen
              />
              <a 
                href={`https://3d.bon-soleil.com/?src=${encodeURIComponent(metadata.animation_url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                Open in full screen
              </a>
            </>
          );
        }
        
        return (
          <video 
            className="media-content" 
            src={metadata.animation_url} 
            controls 
            loop 
            autoPlay 
            muted
          />
        );

      case 'youtube':
        if (!metadata.youtube_url) return null;
        
        const videoId = extractYouTubeVideoId(metadata.youtube_url);
        if (!videoId) {
          return (
            <div className="error-message">
              <p>Invalid YouTube URL</p>
              <a 
                href={metadata.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="external-link"
              >
                Watch on YouTube
              </a>
            </div>
          );
        }
        
        return (
          <iframe
            className="media-content media-content--iframe"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );

      default:
        return null;
    }
  };

  const mediaContent = renderMediaContent();
  if (!mediaContent) return null;

  return (
    <div className="media-container">
      {/* Media Display */}
      <div className="media-display">
        <div className={`media-wrapper ${activeTab === 'youtube' ? 'media-wrapper--video' : ''}`}>
          {mediaContent}
        </div>
      </div>

      {/* Details Display */}
      <div className="details-display">
        <h2>{metadata.name || `NFT #${nft.tokenId}`}</h2>
        {metadata.description && (
          <p className="description">{metadata.description}</p>
        )}
        
        <div className="detail-items">
          <DetailItem label="Token ID" value={nft.tokenId} />
          <DetailItem label="Contract" value={nft.contractAddress} copyable />
          <DetailItem label="Owner" value={nft.owner} copyable link={`/owner/${nft.owner}`} />
          <DetailItem label="Holder" value={nft.holder} copyable link={`/holder/${nft.holder}`} />
          {/* その他の詳細項目 */}
        </div>
      </div>
    </div>
  );
};