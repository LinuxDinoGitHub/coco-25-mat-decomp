"use client"

import Image from "next/image";
import styles from "./page.module.css";
import ModelHandler from "./ModelHandler";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { useState, useRef, useCallback, useEffect } from "react";

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [outputContent, setOutputContent] = useState(null);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  const outputBoxRef = useRef(null);

  // const processImage = (file) => {
  //   if (!file) return;
    
  //   setProcessing(true);

  //   // Linus: Make the function here - no need
  //   // The image should be the parameter file
  //   // For displaying the content go to line 397

  //   setProcessing(false); // After this line, the box will display
  // };

  const handleFile = useCallback((file, source = "unknown") => {
    if (!file) {
      alert('Please select a valid file');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    console.log(`File from ${source}:`, file.name);
    setSelectedFile(file);
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFile(file, "file input");
  };

  // Paste handler
  const handlePaste = useCallback(async (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        event.preventDefault();
        event.stopPropagation();
        
        const file = item.getAsFile();
        if (file) {
          handleFile(file, "paste");
          return;
        }
      }
    }

    const pastedText = event.clipboardData?.getData('text');
    if (pastedText && isImageUrl(pastedText)) {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        setProcessing(true);
        const response = await fetch(pastedText);
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const blob = await response.blob();
        const file = new File([blob], 'pasted-image.jpg', { type: blob.type });
        handleFile(file, "pasted URL");
      } catch (error) {
        console.error('Error fetching pasted image:', error);
        alert('Could not load image from pasted URL');
        setProcessing(false);
      }
    }
  }, [handleFile]);

  useEffect(() => {
    const handleGlobalPaste = (event) => {
      handlePaste(event);
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [handlePaste]);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const items = event.dataTransfer.items;
    
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          handleFile(file, "drag and drop");
          return;
        }
      }
    }

    const url = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');
    
    if (url) {
      try {
        if (isImageUrl(url)) {
          setProcessing(true);
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], 'web-image.jpg', { type: blob.type });
          handleFile(file, "dragged URL");
          return;
        }
      } catch (error) {
        console.error('Error fetching image from URL:', error);
      }
    }

    const html = event.dataTransfer.getData('text/html');
    if (html) {
      const imgUrl = extractImageUrlFromHtml(html);
      if (imgUrl) {
        try {
          setProcessing(true);
          const response = await fetch(imgUrl);
          const blob = await response.blob();
          const file = new File([blob], 'web-image.jpg', { type: blob.type });
          handleFile(file, "dragged HTML");
          return;
        } catch (error) {
          console.error('Error fetching image from HTML:', error);
        }
      }
    }

    alert('Please drag a valid image file or image from a website');
  };

  const isImageUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(urlObj.pathname) || 
             url.startsWith('data:image/') ||
             urlObj.hostname.includes('imgur') ||
             urlObj.hostname.includes('flickr') ||
             urlObj.hostname.includes('unsplash');
    } catch {
      return false;
    }
  };

  const extractImageUrlFromHtml = (html) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const img = doc.querySelector('img');
      return img ? img.src : null;
    } catch (error) {
      console.error('Error parsing HTML:', error);
      return null;
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleReupload = () => {
    fileInputRef.current?.click();
  };

  // display
  return (
    <div className={styles.page}>
      <SpeedInsights/>
      <h1>Material Decomposition</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        id="file-upload"
        style={{ display: 'none' }}
      />

      {/* main content area */}
      <div style={{ 
        display: 'flex', 
        flexDirection: previewUrl ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: previewUrl ? '40px' : '20px',
        minHeight: '400px',
        transition: 'all 0.3s ease'
      }}>
        {/* upload and preview box */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          width: previewUrl ? 'auto' : '100%'
        }}>
          {previewUrl ? (
            // preview mode
            <div
              ref={dropAreaRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{ 
                position: 'relative',
                width: '250px',
                height: '250px',
                border: isDragging ? '2px dashed #007bff' : '1px solid #ccc',
                borderRadius: '8px',
                cursor: isDragging ? 'copy' : 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: isDragging ? '#f0f8ff' : 'transparent'
              }}
            >
              <img 
                src={previewUrl} 
                alt="Processed preview" 
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  opacity: isDragging ? 0.7 : 1
                }} 
                onLoad={() => {
                  URL.revokeObjectURL(previewUrl);
                }}
              />
              
              <button 
                onClick={handleReupload}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  zIndex: 10
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.9)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.7)'}
              >
                Change
              </button>

              {isDragging && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(240, 248, 255, 0.9)',
                  borderRadius: '8px',
                  zIndex: 5
                }}>
                  <span style={{ 
                    color: '#007bff', 
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    Drop to replace image
                  </span>
                </div>
              )}
            </div>
          ) : (
            
            <div
              ref={dropAreaRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
              style={{ 
                width: '200px',
                height: '200px',
                border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                padding: '20px',
                transition: 'all 0.3s ease',
                backgroundColor: isDragging ? '#f0f8ff' : 'transparent',
                boxShadow: isDragging ? '0 0 15px rgba(0, 123, 255, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: isDragging ? '#007bff' : '#666',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '48px', marginBottom: '10px' }}>+</span>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>
                  {isDragging ? 'Drop image here' : 'Upload Image'}
                </span>
                <span style={{ fontSize: '12px', marginTop: '5px', color: isDragging ? '#007bff' : '#999' }}>
                  Click, drag, or paste
                </span>
              </div>
            </div>
          )}

          {processing && (
            <p style={{ marginTop: '15px', color: 'blue' }}>Processing image...</p>
          )}

          {selectedFile && !processing && (
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
              <p>File: {selectedFile.name}</p>
              <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>

        {/* output part */}
        {previewUrl && !processing && (
          <div 
            ref={outputBoxRef}
            style={{ 
              minWidth: '300px',
              maxWidth: '400px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fafafa',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: outputContent ? 'auto' : '250px',
              alignSelf: 'center'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
              Analysis Results
            </h3>
            
            {outputContent ? (
              <div>
                <div style={{ marginBottom: '20px' , color: '#555' }}>
                  <h4 style={{ margin: '0 0 10px 0'}}>Materials:</h4>
                  {outputContent}
                </div>
                
                <div style={{ 
                  padding: '12px',
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px'
                }}>
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '15px', 
                backgroundColor: 'white', 
                border: '1px dashed #ccc',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#888', margin: 0 }}>
                  Analyzing image...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* filler */}
      <div style={{ marginTop: '30px'}}></div>

      {/* Upload instructions only show when no image */}
      {!previewUrl && (
        <div style={{fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <p>Upload an image to begin material decomposition analysis</p>
        </div>
      )}

      {/* bottom yap goes here*/}
      <div style={{ 
        marginTop: '20vh', 
        padding: '40px',
        backgroundColor: '#232323ff',
        borderRadius: '12px',
        lineHeight: '1.6'
      }}>
        <h1 style={{ fontSize: '24px', margin: '30px 0 15px 0', color: '#85c2ff', borderLeft: '4px solid #007bff', paddingLeft: '15px'}}>
          Why did we choose to make this?
        </h1>
        <p style={{ margin: '0 0 30px 20px', color: '#bbb' }}>
          Tbh idk but like im too lazy to type a whole paragraph for the judges
        </p>
        
        <h1 style={{ fontSize: '24px', margin: '30px 0 15px 0', color: '#85c2ff', borderLeft: '4px solid #007bff', paddingLeft: '15px'}}>
          What was our motivation?
        </h1>
        <p style={{ margin: '0 0 30px 20px', color: '#bbb' }}>
          S U F F E R I N G
        </p>

        <h1 style={{ fontSize: '24px', margin: '30px 0 15px 0', color: '#85c2ff', borderLeft: '4px solid #007bff', paddingLeft: '15px'}}>
          Is this text going to be replaced?
        </h1>
        <p style={{ margin: '0 0 30px 20px', color: '#bbb' }}>
          Definitely not and im totally not being sarcastic!!! This text took us a lot of planning and a lot of time and effort went into typing this whole giant paragraph and also man ykw screw ts why am i even typign anymore i should be pasting this to ai to fix bugs and stuff idk anymore
        </p>

        <p style={{ margin: '0 0 -30px 20px', textAlign: 'center', color: '#676767' }}> {/*67 so tuff*/}
          group name here
        </p>
      </div>
      <ModelHandler 
        setCoords={setOutputContent}
        setLoading={setProcessing}
        image={selectedFile}
      />
    </div>
  );
}
