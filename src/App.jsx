import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Camera, SwitchCamera, RefreshCw } from 'lucide-react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const screenshotImgRef = useRef(null);
  
  const [facingMode, setFacingMode] = useState('environment');
  const [captured, setCaptured] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const resetCapture = () => {
    setCaptured(false);
    if (screenshotImgRef.current) {
      screenshotImgRef.current.src = "";
    }
    startCamera();
  };

  const takePhoto = async () => {
    if (!videoRef.current || !containerRef.current) return;
    
    // Create a temporary canvas to capture video frame
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw current video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    
    // Hide video and show image for html2canvas
    screenshotImgRef.current.src = dataUrl;
    setCaptured(true);
    
    // Wait for state to update and image to render
    setTimeout(async () => {
      try {
        const fullCanvas = await html2canvas(containerRef.current, {
          useCORS: true,
          scale: 2, // High resolution
          backgroundColor: null,
        });
        
        // Download the final composite image
        const finalUrl = fullCanvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = `timemark_${Date.now()}.jpg`;
        link.href = finalUrl;
        link.click();
      } catch (err) {
        console.error("Capture failed:", err);
      }
    }, 100);
  };

  return (
    <div className="app-wrapper">
      <div className="camera-container" ref={containerRef}>
        {!captured ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="camera-video"
          />
        ) : (
          <img 
            ref={screenshotImgRef} 
            className="camera-video" 
            alt="captured" 
          />
        )}
        
        <div className="watermark-overlay">
          {/* Top Right Vertical Text */}
          <div className="vertical-watermark">
            <span contentEditable suppressContentEditableWarning>
              © 3P1X2NYRKAU1WH Timemark Verified
            </span>
          </div>
          
          {/* Bottom Info Area */}
          <div className="bottom-info">
            <div className="main-info">
              <img src="/logo.png" alt="wilmar" className="logo" />
              
              <div className="time-date-container">
                <div className="time" contentEditable suppressContentEditableWarning>18:15</div>
                <div className="divider"></div>
                <div className="date-group">
                  <div className="date" contentEditable suppressContentEditableWarning>27 Tháng 3, 2026</div>
                  <div className="day" contentEditable suppressContentEditableWarning>Thứ Sáu</div>
                </div>
              </div>
              
              <div className="location-info">
                <div className="address" contentEditable suppressContentEditableWarning>
                  Skinlab Việt Nam, 36 Phố Hoàng Cầu, P.Ô Chợ Dừa,
                  <br />
                  TP.Hà Nội
                </div>
                
                <div className="user-details">
                  <div>Họ tên: <span contentEditable suppressContentEditableWarning>BÙI THỊ YẾN</span></div>
                  <div>Siêu Thị: <span contentEditable suppressContentEditableWarning>Winmart Hoàng Cầu</span></div>
                </div>
              </div>
            </div>
            
            <div className="timemark-brand">
              <div className="brand-name">Timemark</div>
              <div className="brand-subtitle">100% Chân thực</div>
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        {captured ? (
          <button className="control-btn" onClick={resetCapture}>
            <RefreshCw size={32} />
          </button>
        ) : (
          <>
            <button className="control-btn" onClick={toggleCamera}>
              <SwitchCamera size={32} />
            </button>
            <button className="capture-btn" onClick={takePhoto}>
              <div className="capture-inner"></div>
            </button>
            <div style={{width: 48}}></div> {/* Spacer for symmetry */}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
