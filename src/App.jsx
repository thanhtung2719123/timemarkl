import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Camera, SwitchCamera, RefreshCw, Upload } from 'lucide-react';
import { Rnd } from 'react-rnd';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const screenshotImgRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [facingMode, setFacingMode] = useState('environment');
  const [captured, setCaptured] = useState(false);
  const [stream, setStream] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!uploadedImage && !captured) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [facingMode, uploadedImage, captured]);

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
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setCaptured(false);
      if (screenshotImgRef.current) {
        screenshotImgRef.current.src = url;
      }
    }
    e.target.value = null; 
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const takePhoto = async () => {
    if (!containerRef.current) return;
    
    if (!uploadedImage && videoRef.current) {
      // Capture live video feed
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      if (screenshotImgRef.current) {
         screenshotImgRef.current.src = dataUrl;
      }
    }

    setCaptured(true);
    
    // Allow state to settle, rendering image instead of video
    setTimeout(async () => {
      try {
        const fullCanvas = await html2canvas(containerRef.current, {
          useCORS: true,
          scale: 2, 
          backgroundColor: '#000',
        });
        
        const finalUrl = fullCanvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = `timemark_${Date.now()}.jpg`;
        link.href = finalUrl;
        link.click();
      } catch (err) {
        console.error("Capture failed:", err);
      }
    }, 150);
  };

  return (
    <div className="app-wrapper">
      <div className="camera-container" ref={containerRef}>
        {!captured && !uploadedImage ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="camera-video"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <img 
            ref={screenshotImgRef}
            src={uploadedImage || undefined}
            className="camera-video" 
            style={{ objectFit: 'cover', opacity: 1, backgroundColor: '#000' }}
            alt="background" 
          />
        )}
        
        <div className="watermark-overlay" style={{ pointerEvents: 'none' }}>
          
          {/* Draggable & Resizable Logo using React-RND */}
          <Rnd
            default={{
              x: 16, 
              y: windowSize.height - 280, // Placing it roughly where it was above the numbers
              width: 130, // Default width
              height: 45 // Fixed start height based on ratio
            }}
            bounds="parent"
            enableResizing={!captured ? {
              top: true, right: true, bottom: true, left: true,
              topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
            } : false}
            disableDragging={captured}
            lockAspectRatio={true}
            style={{ 
              pointerEvents: captured ? 'none' : 'auto', 
              zIndex: 10,
              border: captured ? 'none' : '1px dashed rgba(255,255,255,0.3)', // visual hint it handles drag/resize
              touchAction: 'none'
            }}
          >
            <img 
              src="/logo.png" 
              alt="wilmar" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Rnd>


          <div className="vertical-watermark" style={{ pointerEvents: 'auto' }}>
            <span contentEditable suppressContentEditableWarning>
              © 3P1X2NYRKAU1WH Timemark Verified
            </span>
          </div>
          
          <div className="bottom-info">
            <div className="main-info" style={{ pointerEvents: 'auto' }}>
              
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
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImageUpload}
        />
        {captured ? (
          <button className="control-btn" onClick={resetCapture}>
            <RefreshCw size={32} />
          </button>
        ) : (
          <>
            <button className="control-btn" onClick={triggerUpload} title="Upload Image">
              <Upload size={32} />
            </button>
            <button className="capture-btn" onClick={takePhoto}>
              <div className="capture-inner"></div>
            </button>
            {!uploadedImage ? (
              <button className="control-btn" onClick={toggleCamera} title="Switch Camera">
                <SwitchCamera size={32} />
              </button>
            ) : (
              <button className="control-btn" onClick={() => setUploadedImage(null)} title="Back to Camera">
                <Camera size={32} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
