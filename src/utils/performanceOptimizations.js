// Performance optimizations for low-powered devices

// Detect if device is low-powered
export const isLowPowerDevice = () => {
  // Check for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check for low memory devices
  const isLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
  
  // Check for slow connection
  const isSlowConnection = navigator.connection && 
    (navigator.connection.effectiveType === 'slow-2g' || 
     navigator.connection.effectiveType === '2g' ||
     navigator.connection.saveData);
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return isMobile || isLowMemory || isSlowConnection || prefersReducedMotion;
};

// Optimize animations for low-powered devices
export const getAnimationSettings = () => {
  const isLowPower = isLowPowerDevice();
  
  return {
    duration: isLowPower ? '0.1s' : '0.3s',
    easing: isLowPower ? 'linear' : 'ease-out',
    enableAnimations: !isLowPower,
    enableBackdropFilter: !isLowPower,
    enableComplexGradients: !isLowPower,
    enableBoxShadows: !isLowPower
  };
};

// Lazy load components
export const lazyLoadComponent = (importFunc) => {
  // Note: This function should be used with React.lazy() in the component file
  return importFunc;
};

// Debounce function for performance
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
