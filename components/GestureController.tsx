import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GestureControllerProps {
  onGesture?: (gesture: string) => void;
  onZoom?: (zoomDelta: number) => void; // zoomDelta: -1 (zoom in), +1 (zoom out), 0 (no change)
  onPositionChange?: (deltaX: number, deltaY: number, deltaZ: number) => void; // Di chuyển ảnh
  enabled?: boolean;
}

// Gesture types
export type GestureType = 
  | 'wave'           // Vẫy tay
  | 'point'          // Chỉ tay
  | 'fist'           // Nắm tay
  | 'ok'             // OK sign
  | 'thumbs_up'      // Thumbs up
  | 'peace'          // Peace sign
  | 'pinch_in'       // Thu nhỏ (2 tay gần nhau)
  | 'pinch_out'      // Mở rộng (2 tay xa nhau)
  | 'none';

const GestureController: React.FC<GestureControllerProps> = ({ 
  onGesture, 
  onZoom,
  onPositionChange,
  onRotationChange,
  enabled = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true); // Always show preview
  const [detectedGesture, setDetectedGesture] = useState<GestureType | null>(null);
  const [gestureConfidence, setGestureConfidence] = useState(0);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null); // Store stream if video element not ready
  const animationFrameRef = useRef<number>();
  const lastGestureRef = useRef<GestureType>('none');
  const gestureCountRef = useRef<Record<string, number>>({});
  const lastGestureTimeRef = useRef<Record<string, number>>({});
  const gestureCooldownRef = useRef<Record<string, number>>({}); // Cooldown sau mỗi gesture
  const gestureStabilityRef = useRef<Record<string, number>>({}); // Đếm số frame gesture giữ ổn định
  const lastProcessedFrameRef = useRef<number>(0);
  const frameSkipCount = 1; // Process mỗi frame để mượt hơn
  const lastPositionUpdateRef = useRef<number>(0);
  const positionUpdateCooldown = 16; // Update mỗi 16ms (60fps) để cực kỳ mượt
  const globalCooldownRef = useRef<number>(0); // Global cooldown cho tất cả gestures
  const lockedGestureRef = useRef<GestureType | null>(null); // Gesture đang được "lock" (không cho chuyển)
  const gestureTransitionCountRef = useRef<Record<string, number>>({}); // Đếm số lần gesture mới xuất hiện
  const MIN_TRANSITION_FRAMES = 6; // Cần 6 frame liên tiếp mới chuyển gesture (giảm từ 10 để nhạy hơn)

  // Initialize TensorFlow.js HandPose model (optional - fallback to motion detection)
  useEffect(() => {
    if (!enabled) return;

    const loadTensorFlow = async () => {
      try {
        // Check if TensorFlow is already loaded
        if ((window as any).tf) {
          console.log('✅ TensorFlow.js already loaded');
          return;
        }

        console.log('📦 Loading TensorFlow.js from CDN...');
        
        // Load TensorFlow.js from CDN (try multiple sources)
        const tfScript = document.createElement('script');
        tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js';
        tfScript.crossOrigin = 'anonymous';
        document.head.appendChild(tfScript);

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('TensorFlow.js load timeout'));
          }, 10000); // 10 second timeout
          
          tfScript.onload = () => {
            clearTimeout(timeout);
            console.log('✅ TensorFlow.js loaded successfully');
            resolve(true);
          };
          tfScript.onerror = (err) => {
            clearTimeout(timeout);
            console.warn('⚠️ TensorFlow.js CDN failed, trying alternative...');
            // Try alternative CDN
            const altScript = document.createElement('script');
            altScript.src = 'https://unpkg.com/@tensorflow/tfjs@4.10.0/dist/tf.min.js';
            altScript.crossOrigin = 'anonymous';
            document.head.appendChild(altScript);
            
            altScript.onload = () => {
              console.log('✅ TensorFlow.js loaded from alternative CDN');
              resolve(true);
            };
            altScript.onerror = (altErr) => {
              console.warn('⚠️ All TensorFlow.js CDNs failed, using fallback motion detection');
              reject(altErr);
            };
          };
        });

        // Load HandPose model (optional)
        try {
          const handposeScript = document.createElement('script');
          handposeScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose@2.0.0/dist/handpose.min.js';
          handposeScript.crossOrigin = 'anonymous';
          document.head.appendChild(handposeScript);

          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.warn('⚠️ HandPose model load timeout, using fallback');
              resolve(false); // Don't reject, just use fallback
            }, 10000);
            
            handposeScript.onload = () => {
              clearTimeout(timeout);
              console.log('✅ HandPose model loaded successfully');
              resolve(true);
            };
            handposeScript.onerror = () => {
              clearTimeout(timeout);
              console.warn('⚠️ HandPose model failed to load, using fallback');
              resolve(false); // Don't reject, just use fallback
            };
          });
        } catch (err) {
          console.warn('⚠️ HandPose model load error, using fallback:', err);
        }
      } catch (err) {
        console.warn('⚠️ TensorFlow.js failed to load, using fallback motion detection:', err);
        console.log('💡 Fallback motion detection will work without TensorFlow.js');
      }
    };

    loadTensorFlow();
  }, [enabled]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      console.log('📹 Stream obtained:', stream);
      console.log('📹 Stream active:', stream.active);
      console.log('📹 Video tracks:', stream.getVideoTracks().length);

      // Store stream - will be assigned by useEffect when video element is ready
      mediaStreamRef.current = stream;
      pendingStreamRef.current = stream;
      
      setPermissionGranted(true);
      setError(null);
      setIsActive(true); // Set active to trigger preview window render
      
      console.log('📹 Stream stored, useEffect will assign when video element is ready');
    } catch (err: any) {
      console.error('❌ Camera access error:', err);
      setError(err.message || 'Không thể truy cập camera. Vui lòng cho phép truy cập camera.');
      setPermissionGranted(false);
      setIsActive(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsActive(false);
  }, []);

  // Simple gesture detection based on hand landmarks
  const detectGesture = useCallback((landmarks: any[]): GestureType => {
    if (!landmarks || landmarks.length === 0) return 'none';

    // Simplified gesture detection using hand landmarks
    // This is a basic implementation - MediaPipe provides more accurate detection
    
    // Get key points
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const thumbMCP = landmarks[2];
    const indexMCP = landmarks[5];

    // Gesture detection logic với priority và conflict resolution
    // Tính số ngón tay đang giơ lên
    const fingersUp = [
      thumbTip.y < thumbMCP.y,
      indexTip.y < indexMCP.y,
      middleTip.y < landmarks[9].y,
      ringTip.y < landmarks[13].y,
      pinkyTip.y < landmarks[17].y
    ];
    const fingersUpCount = fingersUp.filter(Boolean).length;
    
    // Tính khoảng cách giữa các ngón tay để phân biệt rõ hơn
    const thumbIndexDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    const indexMiddleDist = Math.sqrt(
      Math.pow(indexTip.x - middleTip.x, 2) + 
      Math.pow(indexTip.y - middleTip.y, 2)
    );
    const middleRingDist = Math.sqrt(
      Math.pow(middleTip.x - ringTip.x, 2) + 
      Math.pow(middleTip.y - ringTip.y, 2)
    );
    
    // Priority 1: OK sign - thumb và index tạo vòng tròn (phải check trước fist)
    // OK sign có thumb và index gần nhau NHƯNG các ngón khác không đóng hoàn toàn
    if (thumbIndexDist < 0.05 && fingersUpCount >= 1) {
      // Kiểm tra thêm: middle, ring, pinky phải không đóng hoàn toàn
      const otherFingersClosed = !fingersUp[2] && !fingersUp[3] && !fingersUp[4];
      if (otherFingersClosed) {
        return 'ok';
      }
    }

    // Priority 2: Fist - tất cả ngón tay đóng (phải check sau OK)
    // Fist: không có ngón nào giơ lên VÀ thumb không tạo vòng với index
    if (fingersUpCount === 0 && thumbIndexDist > 0.08) {
      return 'fist';
    }

    // Priority 3: Peace sign - index và middle giơ lên, các ngón khác đóng
    if (fingersUpCount === 2 && 
        fingersUp[1] && fingersUp[2] && // Index và middle up
        !fingersUp[0] && !fingersUp[3] && !fingersUp[4] && // Thumb, ring, pinky down
        indexMiddleDist > 0.1) { // Index và middle cách xa nhau
      return 'peace';
    }

    // Priority 4: Point - chỉ index giơ lên
    if (fingersUpCount === 1 && 
        fingersUp[1] && // Chỉ index up
        !fingersUp[0] && !fingersUp[2] && !fingersUp[3] && !fingersUp[4]) {
      return 'point';
    }

    // Priority 5: Thumbs up - thumb giơ lên, các ngón khác đóng
    if (fingersUpCount === 1 && 
        fingersUp[0] && // Chỉ thumb up
        !fingersUp[1] && !fingersUp[2] && !fingersUp[3] && !fingersUp[4]) {
      return 'thumbs_up';
    }

    // Wave: hand moving horizontally (detected over time - cần motion history)
    // Tạm thời return 'none' vì wave cần motion detection
    return 'none';
  }, []);

  // HandPose model reference
  const handposeModelRef = useRef<any>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const motionHistoryRef = useRef<number[]>([]);
  const previousHandDistanceRef = useRef<number | null>(null);
  const zoomHistoryRef = useRef<number[]>([]);

  // Gesture recognition with improved debouncing, cooldown, and gesture locking - MUST be defined before processFrame
  const handleGestureDetected = useCallback((gesture: GestureType) => {
    const now = Date.now();
    
    // Global cooldown: không trigger bất kỳ gesture nào trong 2 giây sau khi trigger
    if (now - globalCooldownRef.current < 2000) { // 2 giây global cooldown (giảm từ 4s để nhạy hơn)
      return;
    }
    
    // Check cooldown: không trigger gesture nếu vừa trigger gần đây
    const cooldownTime = gestureCooldownRef.current[gesture] || 0;
    if (now - cooldownTime < 3000) { // 3 giây cooldown cho từng gesture (giảm từ 5s để nhạy hơn)
      return;
    }
    
    if (gesture === 'none') {
      // Reset tất cả gesture counters khi không có gesture
      Object.keys(gestureCountRef.current).forEach(key => {
        gestureCountRef.current[key] = 0;
        gestureStabilityRef.current[key] = 0;
        gestureTransitionCountRef.current[key] = 0;
      });
      // Unlock gesture khi không có gesture
      if (lockedGestureRef.current) {
        lockedGestureRef.current = null;
      }
      setDetectedGesture(null);
      setGestureConfidence(0);
      return;
    }

    // GESTURE LOCKING: Nếu đang lock một gesture, chỉ xử lý gesture đó
    const currentLocked = lockedGestureRef.current;
    if (currentLocked && currentLocked !== gesture) {
      // Đang lock gesture khác, cần kiểm tra transition
      gestureTransitionCountRef.current[gesture] = (gestureTransitionCountRef.current[gesture] || 0) + 1;
      
      // Chỉ unlock và chuyển gesture nếu gesture mới xuất hiện liên tiếp 10 frame
      if (gestureTransitionCountRef.current[gesture] >= MIN_TRANSITION_FRAMES) {
        // Unlock gesture cũ và lock gesture mới
        lockedGestureRef.current = gesture;
        // Reset counters cho gesture cũ
        gestureCountRef.current[currentLocked] = 0;
        gestureStabilityRef.current[currentLocked] = 0;
        gestureTransitionCountRef.current[currentLocked] = 0;
        // Reset counter cho gesture mới
        gestureCountRef.current[gesture] = 0;
        gestureStabilityRef.current[gesture] = 0;
        gestureTransitionCountRef.current[gesture] = 0;
        console.log(`🔄 Gesture transition: ${currentLocked} → ${gesture}`);
      } else {
        // Vẫn đang trong quá trình transition, reset counter cho gesture cũ
        gestureTransitionCountRef.current[currentLocked] = 0;
        return; // Không xử lý gesture mới cho đến khi transition hoàn tất
      }
    } else if (!currentLocked) {
      // Chưa lock gesture nào, lock gesture hiện tại
      lockedGestureRef.current = gesture;
      gestureTransitionCountRef.current[gesture] = 0;
    } else {
      // Đang lock đúng gesture, reset transition counter
      gestureTransitionCountRef.current[gesture] = 0;
    }

    const lastTime = lastGestureTimeRef.current[gesture] || 0;
    
    // Tăng stability counter nếu gesture giữ ổn định
    if (now - lastTime < 250) { // Trong 250ms
      gestureStabilityRef.current[gesture] = (gestureStabilityRef.current[gesture] || 0) + 1;
    } else {
      // Reset nếu gesture thay đổi (nhưng vẫn giữ lock)
      gestureStabilityRef.current[gesture] = 1;
      gestureCountRef.current[gesture] = 0;
    }
    
    // Chỉ đếm nếu gesture ổn định ít nhất 4 frame liên tiếp
    if (gestureStabilityRef.current[gesture] >= 4) {
      if (now - lastTime < 600) { // Debounce 600ms (giảm để đạt 1-2 giây)
        gestureCountRef.current[gesture] = (gestureCountRef.current[gesture] || 0) + 1;
      } else {
        gestureCountRef.current[gesture] = 1;
      }
    }

    lastGestureTimeRef.current[gesture] = now;

    // Update UI feedback (chỉ hiển thị khi có stability)
    if (gestureStabilityRef.current[gesture] >= 4) {
      setDetectedGesture(gesture);
      const confidence = Math.min(100, (gestureCountRef.current[gesture] / 3) * 100); // Cần 3 lần để đạt 1-2 giây
      setGestureConfidence(confidence);
    }

    // Trigger gesture nếu detected 3+ lần (held for ~1-2s) và gesture khác với lần trước
    if (gestureCountRef.current[gesture] >= 3 && lastGestureRef.current !== gesture) { // Giảm xuống 3 để đạt 1-2 giây
      lastGestureRef.current = gesture;
      gestureCooldownRef.current[gesture] = now; // Set cooldown cho gesture này
      globalCooldownRef.current = now; // Set global cooldown
      console.log('🎯 Gesture triggered:', gesture);
      onGesture?.(gesture);
      
      // Show success feedback
      setDetectedGesture(gesture);
      setGestureConfidence(100);
      
      // Reset counter sau khi trigger
      gestureCountRef.current[gesture] = 0;
      gestureStabilityRef.current[gesture] = 0;
      
      // Unlock gesture sau khi trigger để cho phép gesture mới
      setTimeout(() => {
        lockedGestureRef.current = null;
      }, 1000); // Unlock sau 1s
      
      // Reset UI sau 2s
      setTimeout(() => {
        if (lastGestureRef.current === gesture) {
          lastGestureRef.current = 'none';
          setDetectedGesture(null);
          setGestureConfidence(0);
        }
      }, 2000);
    }
  }, [onGesture]);

  // Assign pending stream to video element when it becomes available
  useEffect(() => {
    // Check periodically for video element and pending stream
    const checkAndAssign = () => {
      if (pendingStreamRef.current && videoRef.current) {
        console.log('📹 Video element available, assigning pending stream...');
        console.log('📹 Pending stream:', pendingStreamRef.current);
        console.log('📹 Video element:', videoRef.current);
        
        videoRef.current.srcObject = pendingStreamRef.current;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        console.log('📹 Stream assigned to video element');
        console.log('📹 Video srcObject after assignment:', videoRef.current.srcObject);
        console.log('📹 Stream active:', (videoRef.current.srcObject as MediaStream)?.active);
        
        // Clear pending stream
        pendingStreamRef.current = null;
        
        // Wait for video to be ready
        const handleLoadedMetadata = () => {
          console.log('✅ Video metadata loaded');
          console.log('📐 Video size:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          console.log('📐 Video readyState:', videoRef.current?.readyState);
          
          // Force play
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('✅ Video playback started successfully');
                console.log('▶️ Video playing:', !videoRef.current?.paused);
                console.log('▶️ Video currentTime:', videoRef.current?.currentTime);
              })
              .catch((err) => {
                console.error('⚠️ Video play error:', err);
                setError('Không thể phát video. Vui lòng click vào trang để cho phép phát video.');
              });
          }
        };

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        // Also check if already loaded
        setTimeout(() => {
          if (videoRef.current) {
            if (videoRef.current.readyState >= 1) {
              console.log('📹 Video already has metadata, triggering handler');
              handleLoadedMetadata();
            } else {
              console.log('⏳ Video readyState:', videoRef.current.readyState, '- waiting for metadata...');
            }
          }
        }, 200);
        
        return true; // Successfully assigned
      }
      return false; // Not ready yet
    };

    // Try immediately
    if (checkAndAssign()) {
      return; // Success
    }

    // If not ready, try periodically
    const interval = setInterval(() => {
      if (checkAndAssign()) {
        clearInterval(interval);
      }
    }, 100);

    // Cleanup
    return () => clearInterval(interval);
  }, [isActive, permissionGranted, showPreview]); // Run when preview window renders

  // Auto-start camera when enabled
  useEffect(() => {
    if (enabled && !isActive && !permissionGranted && !error) {
      console.log('📹 Auto-starting camera (enabled and not active)...');
      startCamera();
    }
  }, [enabled, isActive, permissionGranted, error, startCamera]);

  // Initialize HandPose model
  useEffect(() => {
    if (!enabled || !isActive) return;

    const initModel = async () => {
      try {
        if ((window as any).handpose && (window as any).tf) {
          const model = await (window as any).handpose.load();
          handposeModelRef.current = model;
          console.log('HandPose model loaded successfully');
        }
      } catch (err) {
        console.warn('HandPose model failed to load:', err);
      }
    };

    initModel();
  }, [enabled, isActive]);

  // Process video frame with gesture detection
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    // Frame skipping: chỉ process mỗi 2 frame để giảm tải và tránh false positives
    lastProcessedFrameRef.current++;
    if (lastProcessedFrameRef.current % frameSkipCount !== 0) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Draw video frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try to use HandPose model if available
    if (handposeModelRef.current && (window as any).tf) {
      try {
        const predictions = await handposeModelRef.current.estimateHands(video);
        
        if (predictions && predictions.length > 0) {
          const hand = predictions[0];
          const landmarks = hand.landmarks;
          
          // Detect gesture from landmarks
          const detectedGesture = detectGesture(landmarks);
          if (detectedGesture !== 'none') {
            handleGestureDetected(detectedGesture);
          }
          
          // Detect pinch gesture for zoom (2 hands)
          if (predictions.length >= 2) {
            const hand1 = predictions[0].landmarks;
            const hand2 = predictions[1].landmarks;
            
            // Calculate distance between wrist centers
            const hand1Wrist = hand1[0];
            const hand2Wrist = hand2[0];
            const distance = Math.sqrt(
              Math.pow(hand1Wrist.x - hand2Wrist.x, 2) +
              Math.pow(hand1Wrist.y - hand2Wrist.y, 2)
            );
            
            if (previousHandDistanceRef.current !== null) {
              const delta = distance - previousHandDistanceRef.current;
              zoomHistoryRef.current.push(delta);
              // Tăng số frame smoothing từ 5 lên 12 để mượt hơn
              if (zoomHistoryRef.current.length > 12) {
                zoomHistoryRef.current.shift();
              }
              
              // Exponential weighted moving average (EWMA) cho mượt hơn
              const weights = [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.0, 1.8, 1.6, 1.4, 1.2, 1.0];
              const weightedSum = zoomHistoryRef.current.reduce((sum, val, idx) => {
                const weight = weights[Math.min(idx, weights.length - 1)] || 1;
                return sum + val * weight;
              }, 0);
              const weightSum = zoomHistoryRef.current.reduce((sum, _, idx) => {
                const weight = weights[Math.min(idx, weights.length - 1)] || 1;
                return sum + weight;
              }, 0);
              const avgDelta = weightedSum / weightSum;
              
              // Giảm threshold từ 0.02 xuống 0.008 để responsive hơn
              if (Math.abs(avgDelta) > 0.008) {
                // Tính zoom delta dựa trên độ lớn của thay đổi (adaptive)
                const zoomMagnitude = Math.min(Math.abs(avgDelta) * 8, 0.15); // Max 0.15 per frame
                if (avgDelta < 0) {
                  // Hands getting closer = zoom in (ảnh gần cây thông)
                  onZoom?.(-zoomMagnitude);
                } else {
                  // Hands getting farther = zoom out (ảnh xa cây thông)
                  onZoom?.(zoomMagnitude);
                }
              }
            }
            
            previousHandDistanceRef.current = distance;
          } else {
            previousHandDistanceRef.current = null;
            zoomHistoryRef.current = [];
          }
          
          // Detect hand movement for position control (1 hand movement)
          // Chỉ xử lý nếu không có gesture đang được detect (tránh conflict)
          if (predictions.length === 1 && lastGestureRef.current === 'none') {
            const hand = predictions[0].landmarks;
            const wrist = hand[0];
            const currentPos = { x: wrist.x, y: wrist.y };
            
            if (previousHandPositionRef.current) {
              const deltaX = currentPos.x - previousHandPositionRef.current.x;
              const deltaY = currentPos.y - previousHandPositionRef.current.y;
              
              positionHistoryRef.current.push({ x: deltaX, y: deltaY });
              if (positionHistoryRef.current.length > 12) { // Tăng buffer lên 12 để cực kỳ mượt
                positionHistoryRef.current.shift();
              }
              
              // Average movement với weighted average (recent frames có trọng số cao hơn)
              const weights = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.2];
              const weightedSumX = positionHistoryRef.current.reduce((sum, p, idx) => {
                const weight = weights[Math.min(idx, weights.length - 1)] || 1;
                return sum + p.x * weight;
              }, 0);
              const weightedSumY = positionHistoryRef.current.reduce((sum, p, idx) => {
                const weight = weights[Math.min(idx, weights.length - 1)] || 1;
                return sum + p.y * weight;
              }, 0);
              const weightSum = positionHistoryRef.current.reduce((sum, _, idx) => {
                const weight = weights[Math.min(idx, weights.length - 1)] || 1;
                return sum + weight;
              }, 0);
              
              const avgDeltaX = weightedSumX / weightSum;
              const avgDeltaY = weightedSumY / weightSum;
              
              // Giảm threshold để responsive hơn
              const now = Date.now();
              if ((Math.abs(avgDeltaX) > 0.01 || Math.abs(avgDeltaY) > 0.01) && 
                  (now - lastPositionUpdateRef.current) >= positionUpdateCooldown) {
                // Map hand movement to 3D position với scale cao hơn để mượt và responsive
                onPositionChange?.(
                  avgDeltaX * 0.4, // Tăng scale để responsive hơn
                  -avgDeltaY * 0.4, // Invert Y (hand up = move up)
                  0 // Z controlled by zoom
                );
                lastPositionUpdateRef.current = now;
              }
              
              // Detect hand rotation for camera/scene rotation
              // Tính góc xoay của bàn tay dựa trên hướng từ wrist đến middle finger
              const middleFinger = hand[9];
              const handDirection = Math.atan2(
                middleFinger.y - wrist.y,
                middleFinger.x - wrist.x
              );
              
              if (previousHandRotationRef.current !== null) {
                let deltaRotation = handDirection - previousHandRotationRef.current;
                
                // Normalize angle difference to [-PI, PI]
                if (deltaRotation > Math.PI) deltaRotation -= 2 * Math.PI;
                if (deltaRotation < -Math.PI) deltaRotation += 2 * Math.PI;
                
                rotationHistoryRef.current.push(deltaRotation);
                if (rotationHistoryRef.current.length > 8) { // Tăng buffer để mượt hơn
                  rotationHistoryRef.current.shift();
                }
                
                // Average rotation với weighted average
                const weights = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1];
                const weightedSum = rotationHistoryRef.current.reduce((sum, val, idx) => {
                  const weight = weights[Math.min(idx, weights.length - 1)] || 1;
                  return sum + val * weight;
                }, 0);
                const weightSum = rotationHistoryRef.current.reduce((sum, _, idx) => {
                  const weight = weights[Math.min(idx, weights.length - 1)] || 1;
                  return sum + weight;
                }, 0);
                const avgRotation = weightedSum / weightSum;
                
                // Threshold cho rotation (nhỏ hơn để sensitive và mượt hơn)
                if (Math.abs(avgRotation) > 0.008 && (now - lastPositionUpdateRef.current) >= positionUpdateCooldown) {
                  // Xoay camera/scene: deltaX = xoay ngang (yaw), deltaY = xoay dọc (pitch)
                  // Chỉ xoay ngang (yaw) khi xoay tay ngang
                  onRotationChange?.(
                    avgRotation * 0.6, // Tăng scale để mượt và responsive hơn
                    0 // Không xoay dọc (pitch) - có thể thêm sau
                  );
                }
              }
              
              previousHandRotationRef.current = handDirection;
            }
            
            previousHandPositionRef.current = currentPos;
          } else {
            previousHandPositionRef.current = null;
            positionHistoryRef.current = [];
            previousHandRotationRef.current = null;
            rotationHistoryRef.current = [];
          }
        }
      } catch (err) {
        console.warn('HandPose prediction error:', err);
      }
    } else {
      // Fallback: Enhanced motion detection for gesture recognition (no TensorFlow.js needed)
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (previousFrameRef.current) {
        // Calculate motion in different regions for better gesture detection
        const width = canvas.width;
        const height = canvas.height;
        const regions = {
          left: { motion: 0, count: 0 },
          center: { motion: 0, count: 0 },
          right: { motion: 0, count: 0 },
          top: { motion: 0, count: 0 },
          bottom: { motion: 0, count: 0 }
        };
        
        // Sample pixels for performance (every 2nd pixel)
        for (let y = 0; y < height; y += 2) {
          for (let x = 0; x < width; x += 2) {
            const idx = (y * width + x) * 4;
            if (idx < currentFrame.data.length && idx < previousFrameRef.current.data.length) {
              // Calculate RGB difference
              const diff = Math.abs(currentFrame.data[idx] - previousFrameRef.current.data[idx]) +
                           Math.abs(currentFrame.data[idx + 1] - previousFrameRef.current.data[idx + 1]) +
                           Math.abs(currentFrame.data[idx + 2] - previousFrameRef.current.data[idx + 2]);
              
              // Horizontal regions
              if (x < width / 3) {
                regions.left.motion += diff;
                regions.left.count++;
              } else if (x < (width * 2) / 3) {
                regions.center.motion += diff;
                regions.center.count++;
              } else {
                regions.right.motion += diff;
                regions.right.count++;
              }
              
              // Vertical regions
              if (y < height / 2) {
                regions.top.motion += diff;
                regions.top.count++;
              } else {
                regions.bottom.motion += diff;
                regions.bottom.count++;
              }
            }
          }
        }
        
        // Normalize motion by region
        const leftMotion = regions.left.count > 0 ? regions.left.motion / regions.left.count : 0;
        const centerMotion = regions.center.count > 0 ? regions.center.motion / regions.center.count : 0;
        const rightMotion = regions.right.count > 0 ? regions.right.motion / regions.right.count : 0;
        const topMotion = regions.top.count > 0 ? regions.top.motion / regions.top.count : 0;
        const bottomMotion = regions.bottom.count > 0 ? regions.bottom.motion / regions.bottom.count : 0;
        
        const totalMotion = (leftMotion + centerMotion + rightMotion) / 3;
        
        motionHistoryRef.current.push(totalMotion);
        if (motionHistoryRef.current.length > 15) {
          motionHistoryRef.current.shift();
        }
        
        // Enhanced gesture detection with pattern recognition
        if (motionHistoryRef.current.length >= 8) {
          const avgMotion = motionHistoryRef.current.reduce((a, b) => a + b, 0) / motionHistoryRef.current.length;
          const variance = motionHistoryRef.current.reduce((sum, val) => sum + Math.pow(val - avgMotion, 2), 0) / motionHistoryRef.current.length;
          
          // Wave detection: horizontal oscillation pattern (left-right movement)
          const recentMotions = motionHistoryRef.current.slice(-8);
          const oscillations = [];
          for (let i = 1; i < recentMotions.length; i++) {
            oscillations.push(Math.abs(recentMotions[i] - recentMotions[i - 1]));
          }
          const avgOscillation = oscillations.reduce((a, b) => a + b, 0) / oscillations.length;
          
          // Gesture detection logic
          // Wave: high oscillation + good variance (left-right movement)
          if (avgOscillation > 8 && variance > 80 && totalMotion > 12) {
            handleGestureDetected('wave');
          } 
          // Point: motion concentrated in center region
          else if (centerMotion > leftMotion * 1.3 && centerMotion > rightMotion * 1.3 && totalMotion > 18) {
            handleGestureDetected('point');
          }
          // Fist: very low motion overall
          else if (totalMotion < 6 && variance < 25) {
            handleGestureDetected('fist');
          }
          // Thumbs up: motion in upper region
          else if (topMotion > bottomMotion * 1.2 && totalMotion > 20) {
            handleGestureDetected('thumbs_up');
          }
          // Peace: moderate motion with high variance
          else if (totalMotion > 15 && variance > 120) {
            handleGestureDetected('peace');
          }
          // OK sign: circular motion pattern (detected by alternating high/low motion)
          else if (oscillations.filter(o => o > 10).length >= 3 && variance > 100) {
            handleGestureDetected('ok');
          }
          else if (totalMotion < 4 && variance < 15) {
            // Very little motion - reset
            handleGestureDetected('none');
          }
        }
      }
      
      previousFrameRef.current = currentFrame;
    }
    
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isActive, detectGesture, handleGestureDetected, onZoom]);

  // Start processing when camera is active
  useEffect(() => {
    if (isActive && videoRef.current) {
      const handleLoadedMetadata = () => {
        console.log('📹 Video metadata loaded, starting frame processing');
        processFrame();
      };
      
      const handleCanPlay = () => {
        console.log('▶️ Video can play, ensuring playback');
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.warn('Play error:', err);
          });
        }
      };

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('canplay', handleCanPlay);
      
      // Also try to start immediately if already loaded
      if (videoRef.current.readyState >= 2) {
        handleLoadedMetadata();
      }

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('canplay', handleCanPlay);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isActive, processFrame]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle drag for camera preview
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!previewRef.current) return;
    setIsDragging(true);
    const rect = previewRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !previewRef.current) return;
    setPreviewPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!enabled) return null;

  return (
    <>

      {/* Camera Preview Window - Always visible when camera is active */}
      {(isActive || permissionGranted) && showPreview && (
        <div
          ref={previewRef}
          onMouseDown={handleMouseDown}
          className="fixed z-[200] rounded-xl overflow-hidden border-2 border-white/40 shadow-2xl bg-black/80 backdrop-blur-md transition-all duration-300"
          style={{
            left: previewPosition.x || 'calc(100% - 300px)',
            top: previewPosition.y || 'calc(100% - 280px)',
            width: '280px',
            height: '210px',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Header with title - No close button, always visible */}
          <div className="flex items-center justify-between bg-gradient-to-r from-red-600/80 to-amber-600/80 px-2 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">📹</span>
              <span className="text-white text-xs font-semibold">Camera Live</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Video preview - Always render video element */}
          <div className="relative w-full h-[calc(100%-36px)] bg-black overflow-hidden rounded-b-xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                transform: 'scaleX(-1)', // Mirror for selfie view
                minWidth: '100%',
                minHeight: '100%',
                backgroundColor: '#000',
                display: 'block',
                imageRendering: 'auto',
                WebkitTransform: 'scaleX(-1)',
                MozTransform: 'scaleX(-1)',
                msTransform: 'scaleX(-1)'
              }}
              onLoadedMetadata={() => {
                console.log('📹 Preview video onLoadedMetadata: Video metadata loaded');
                if (videoRef.current) {
                  console.log('📐 Preview dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                  console.log('▶️ Video readyState:', videoRef.current.readyState);
                  console.log('📹 Video srcObject:', videoRef.current.srcObject);
                }
              }}
              onCanPlay={() => {
                console.log('▶️ Preview video onCanPlay: Video can start playing');
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play()
                    .then(() => console.log('✅ Play in onCanPlay succeeded'))
                    .catch(err => console.warn('⚠️ Play in onCanPlay failed:', err));
                }
              }}
              onPlay={() => {
                console.log('✅ Preview video onPlay: Video is now playing');
                console.log('▶️ Video paused:', videoRef.current?.paused);
                console.log('▶️ Video currentTime:', videoRef.current?.currentTime);
              }}
              onPlaying={() => {
                console.log('🎬 Preview video onPlaying: Video is actively playing');
              }}
              onError={(e) => {
                console.error('❌ Preview video error:', e);
                console.error('❌ Video error code:', (e.target as HTMLVideoElement)?.error?.code);
                setError('Lỗi khi phát video camera');
              }}
            />
            {(!videoRef.current || !videoRef.current.srcObject) && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm bg-black/50 z-10">
                Đang khởi động camera...
              </div>
            )}
            
            {/* Gesture detection overlay - Không che video, hiển thị ở góc */}
            {detectedGesture && detectedGesture !== 'none' && (
              <div className="absolute top-2 right-2 bg-gradient-to-br from-black/90 via-black/85 to-black/90 backdrop-blur-lg rounded-lg p-3 border-2 border-white/30 shadow-2xl min-w-[140px] animate-[slideIn_0.3s_ease-out]">
                {/* Emoji cử chỉ */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-3xl animate-pulse">
                    {detectedGesture === 'wave' && '👋'}
                    {detectedGesture === 'point' && '👆'}
                    {detectedGesture === 'fist' && '✊'}
                    {detectedGesture === 'ok' && '👌'}
                    {detectedGesture === 'thumbs_up' && '👍'}
                    {detectedGesture === 'peace' && '✌️'}
                  </div>
                  <div className="text-white text-sm font-bold drop-shadow-lg">
                    {detectedGesture === 'wave' && 'Vẫy tay'}
                    {detectedGesture === 'point' && 'Chỉ tay'}
                    {detectedGesture === 'fist' && 'Nắm tay'}
                    {detectedGesture === 'ok' && 'OK Sign'}
                    {detectedGesture === 'thumbs_up' && 'Thumbs Up'}
                    {detectedGesture === 'peace' && 'Peace Sign'}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 transition-all duration-150 shadow-lg"
                    style={{ width: `${gestureConfidence}%` }}
                  ></div>
                </div>
                
                {/* Thông tin kích hoạt */}
                <div className="text-white/90 text-[10px] font-semibold text-center">
                  {Math.round(gestureConfidence)}% - Giữ 1-2s
                </div>
              </div>
            )}

            {/* Status indicator - Chỉ hiển thị khi không có gesture */}
            {!detectedGesture && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded-full backdrop-blur-md border border-white/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white text-[10px] font-semibold">Đang quay</span>
              </div>
            )}

            {/* Instructions hint - Rõ ràng, dễ hiểu */}
            {!detectedGesture && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 px-3 py-2 rounded-lg backdrop-blur-md border border-white/20 shadow-lg">
                <div className="text-white text-[11px] text-center space-y-1.5">
                  <div className="font-bold text-white">Cử chỉ tay:</div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="bg-white/10 px-2 py-0.5 rounded">👋 Vẫy</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded">👆 Chỉ</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded">✊ Nắm</span>
                  </div>
                  <div className="text-white/80 text-[10px] pt-1 border-t border-white/10">
                    🤏 2 tay gần/xa = Zoom | 🔄 Xoay tay = Xoay camera
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview is always visible when camera is active - no hide button */}

      {/* Control Panel - Mobile optimized */}
      <div className="fixed bottom-16 sm:bottom-20 md:bottom-4 right-2 sm:right-4 z-[200] flex flex-col items-end gap-2 safe-area-bottom">
      {/* Camera Toggle Button */}
      <button
        onClick={() => {
          if (isActive) {
            stopCamera();
          } else {
            startCamera();
          }
        }}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg transition-all duration-300 min-w-[44px] min-h-[44px] ${
          isActive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
        } hover:scale-110 active:scale-95 touch-manipulation`}
        aria-label={isActive ? 'Tắt camera' : 'Bật camera'}
      >
        {isActive ? '📷' : '📹'}
      </button>

      {/* Status indicator - Mobile optimized */}
      {isActive && (
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/70 text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full backdrop-blur-md">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="hidden xs:inline">Camera đang hoạt động</span>
          <span className="xs:hidden">Đang bật</span>
        </div>
      )}

      {/* Error message - Mobile optimized */}
      {error && (
        <div className="bg-red-600/90 text-white text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg backdrop-blur-md max-w-[200px] sm:max-w-xs">
          {error}
        </div>
      )}


      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
      </div>
    </>
  );
};

export default GestureController;

