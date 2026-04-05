import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Camera, SwitchCamera, RefreshCw, Upload, Download } from 'lucide-react';
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
  const [capturedImage, setCapturedImage] = useState(null);
  const [customOffset, setCustomOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date(Date.now() + customOffset));
    }, 1000);
    return () => clearInterval(timer);
  }, [customOffset]);

  const handleTimeChange = (e) => {
    if (!e.target.value) return;
    const [hours, minutes] = e.target.value.split(':');
    const newDate = new Date(currentDate.getTime());
    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), newDate.getSeconds(), 0);
    setCustomOffset(newDate.getTime() - Date.now());
  };

  const handleDateChange = (e) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-');
    const newDate = new Date(currentDate.getTime());
    newDate.setFullYear(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    setCustomOffset(newDate.getTime() - Date.now());
  };

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
    setCapturedImage(null);
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
        setCapturedImage(finalUrl);
        const link = document.createElement('a');
        link.download = `timemark_${Date.now()}.jpg`;
        link.href = finalUrl;
        link.click();
      } catch (err) {
        console.error("Capture failed:", err);
      }
    }, 150);
  };

  const triggerManualDownload = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `timemark_${Date.now()}.jpg`;
      link.href = capturedImage;
      link.click();
    }
  };

  const formattedTime = currentDate.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'});
  const theDay = currentDate.getDate();
  const theMonth = currentDate.getMonth() + 1;
  const theYear = currentDate.getFullYear();
  const formattedDate = `${theDay} Tháng ${theMonth}, ${theYear}`;
  const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const formattedDay = weekdays[currentDate.getDay()];
  
  const inputTimeValue = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
  const inputDateValue = `${theYear}-${theMonth.toString().padStart(2, '0')}-${theDay.toString().padStart(2, '0')}`;

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
                <div style={{ position: 'relative' }}>
                  {!captured && (
                    <input 
                      type="time" 
                      value={inputTimeValue}
                      onChange={handleTimeChange}
                      data-html2canvas-ignore="true"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                    />
                  )}
                  <div className="time">{formattedTime}</div>
                </div>
                <div className="divider"></div>
                <div className="date-group" style={{ position: 'relative' }}>
                  {!captured && (
                    <input 
                      type="date" 
                      value={inputDateValue}
                      onChange={handleDateChange}
                      data-html2canvas-ignore="true"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                    />
                  )}
                  <div className="date">{formattedDate}</div>
                  <div className="day">{formattedDay}</div>
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
          <>
            <button className="control-btn" onClick={resetCapture} title="Retry">
              <RefreshCw size={32} />
            </button>
            <button className="control-btn" onClick={triggerManualDownload} title="Save to Phone">
              <Download size={32} />
            </button>
          </>
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
