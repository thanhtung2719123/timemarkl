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
  const [backgroundFrame, setBackgroundFrame] = useState(null);
  const [customOffset, setCustomOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const supermarketAddresses = {
    "Winmart Hoàng Cầu": "36 Phố Hoàng Cầu, P.Ô Chợ Dừa, TP.Hà Nội",
    "Winmart Nguyễn Chí Thanh": "54A Nguyễn Chí Thanh, Láng Thượng, Đống Đa, Hà Nội",
    "Winmart Trúc Khê": "19 P. Trúc Khê, Láng Hạ, Láng, Hà Nội 117068",
    "Winmart La Thành": "609 Đ. La Thành, Thành Công, Ba Đình, Hà Nội"
  };

  const [supermarket, setSupermarket] = useState("Winmart Trúc Khê");
  const [countdown, setCountdown] = useState(null);

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
    setBackgroundFrame(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setBackgroundFrame(url);
      setCaptured(false);
    }
    e.target.value = null; 
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const takePhoto = async () => {
    if (!containerRef.current || countdown !== null) return;
    
    // Start countdown
    let secondsLeft = 5;
    setCountdown(secondsLeft);
    
    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setCountdown(secondsLeft);
      } else {
        clearInterval(interval);
        setCountdown(null);
        performCapture();
      }
    }, 1000);
  };

  const performCapture = async () => {
    if (!containerRef.current) return;
    let frameUrl = uploadedImage;

    // Root fix: If live camera, draw the video frame to a hidden canvas NOW
    if (!uploadedImage && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      frameUrl = canvas.toDataURL('image/png');
    }

    if (!frameUrl) return;

    // Immediately swap UI to show ONLY the frozen <img>
    setBackgroundFrame(frameUrl);
    setCaptured(true);
    
    // Give browser one tick to render the <img> and remove the <video>
    setTimeout(async () => {
      try {
        const fullCanvas = await html2canvas(containerRef.current, {
          useCORS: true,
          scale: 2, 
          backgroundColor: '#000',
          logging: false,
        });
        
        const finalUrl = fullCanvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(finalUrl);
        
        const link = document.createElement('a');
        link.download = `timemark_${Date.now()}.jpg`;
        link.href = finalUrl;
        link.click();
      } catch (err) {
        console.error("Capture failed:", err);
      }
    }, 200); 
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
  const theDay = currentDate.getDate().toString().padStart(2, '0');
  const monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const theMonth = monthNames[currentDate.getMonth()];
  const theYear = currentDate.getFullYear();
  const formattedDate = `${theDay} Tháng ${theMonth}, ${theYear}`;
  const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  const formattedDay = weekdays[currentDate.getDay()];
  
  const inputTimeValue = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
  const inputDateValue = `${theYear}-${(currentDate.getMonth()+1).toString().padStart(2, '0')}-${theDay}`;

  return (
    <div className="app-wrapper">
      {countdown !== null && (
        <div className="countdown-overlay">
          <div className="countdown-number">{countdown}</div>
        </div>
      )}
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
            src={backgroundFrame || undefined}
            className="camera-video" 
            style={{ objectFit: 'cover', backgroundColor: '#000' }}
            alt="background" 
          />
        )}
        
        <div className="watermark-overlay" style={{ pointerEvents: 'none' }}>
          
          {/* Manual Logo Logic - Standard Rnd replacement */}
          <Rnd
            default={{
              x: 140, 
              y: windowSize.height - 305, // Positioned on top of date
              width: 110,
              height: 38
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
              border: captured ? 'none' : '1px dashed rgba(255,255,255,0.3)',
            }}
          >
            <div data-html2canvas-ignore="false" style={{ width: '100%', height: '100%' }}>
              <img 
                src="/logo.png" 
                alt="wilmar" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
              />
            </div>
          </Rnd>


          <div className="vertical-watermark" style={{ pointerEvents: 'auto' }}>
            <span contentEditable suppressContentEditableWarning>
              © 3P1X2NYRKAU1WH Timemark Verified
            </span>
          </div>
          
          <div className="bottom-info">
            <div className="watermark-main-container">
              <div className="time-date-row">
                <div className="time-display-container">
                   {!captured && (
                    <input 
                      type="time" 
                      value={inputTimeValue}
                      onChange={handleTimeChange}
                      data-html2canvas-ignore="true"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                    />
                  )}
                  <span className="time-text">{formattedTime}</span>
                </div>
                
                <div className="orange-divider"></div>
                
                <div className="date-display-container">
                  {!captured && (
                    <input 
                      type="date" 
                      value={inputDateValue}
                      onChange={handleDateChange}
                      data-html2canvas-ignore="true"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                    />
                  )}
                  <div className="date-text">{formattedDate}</div>
                  <div className="day-text">{formattedDay}</div>
                </div>
              </div>

              <div className="address-text" contentEditable suppressContentEditableWarning>
                {supermarketAddresses[supermarket]}
              </div>

              <div className="user-details-box">
                <div className="detail-line">Họ tên: <span contentEditable suppressContentEditableWarning>Bùi Thị Yến</span></div>
                <div className="detail-line">Siêu thị: <span>{supermarket}</span></div>
              </div>
            </div>

            <div className="brand-corner">
              <div className="brand-flex">
                <span className="brand-main">Time</span>
                <span className="brand-sub">mark</span>
              </div>
              <div className="brand-tagline">100% Chân thực</div>
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

        {!captured && (
          <div className="supermarket-selector-container">
            <select 
              className="supermarket-select"
              value={supermarket}
              onChange={(e) => setSupermarket(e.target.value)}
            >
              <option value="Winmart Hoàng Cầu">Winmart Hoàng Cầu</option>
              <option value="Winmart Nguyễn Chí Thanh">Winmart Nguyễn Chí Thanh</option>
              <option value="Winmart Trúc Khê">Winmart Trúc Khê</option>
              <option value="Winmart La Thành">Winmart La Thành</option>
            </select>
          </div>
        )}

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
