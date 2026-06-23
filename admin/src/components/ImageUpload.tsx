import React, { useState, useRef } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { compressImage } from '../lib/compress';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, label = 'Image', className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);

    try {
      // Compress the image file to max 1000x1000px with 0.8 quality
      const compressedFile = await compressImage(file, { maxWidth: 1000, maxHeight: 1000 });
      
      const formData = new FormData();
      formData.append('image', compressedFile);

      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        onChange(res.data.url);
      }
    } catch (err) {
      console.error('Image upload failed', err);
      toast.error('Image upload failed. Is backend running?');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const removeImage = () => {
    onChange('');
  };

  let baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://fanclub-backend.onrender.com';
  if (baseUrl.includes('localhost') && typeof window !== 'undefined') {
    baseUrl = baseUrl.replace('localhost', window.location.hostname);
  }
  const displayUrl = value?.startsWith('/') ? baseUrl + value : value;

  return (
    <div className={className} style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', marginBottom: 6, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-primary)' }}>{label}</label>}
      
      {value ? (
        <div style={{ position: 'relative', border: '2px solid var(--bauhaus-black)', padding: 8, background: 'var(--bg-primary)', display: 'inline-block' }}>
          <img src={displayUrl} alt="Uploaded" style={{ height: 120, objectFit: 'contain', display: 'block' }} />
          <button 
            type="button" 
            onClick={removeImage}
            style={{ 
              position: 'absolute', top: -10, right: -10, 
              background: 'var(--bauhaus-red)', color: 'white', 
              border: '2px solid var(--bauhaus-black)', 
              borderRadius: '50%', width: 24, height: 24, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer' 
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `3px dashed ${dragActive ? 'var(--bauhaus-blue)' : 'var(--bauhaus-black)'}`,
            padding: '24px',
            textAlign: 'center',
            background: dragActive ? 'rgba(36, 99, 235, 0.05)' : 'var(--bg-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
              <Loader2 size={32} className="spin" style={{ color: 'var(--bauhaus-blue)' }} />
              <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Uploading...</p>
            </div>
          ) : (
            <>
              <div style={{
                width: 48, height: 48,
                background: 'var(--bauhaus-black)',
                border: '2px solid var(--bauhaus-black)',
                boxShadow: '2px 2px 0px 0px var(--bauhaus-yellow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Upload size={20} color="white" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Drag & Drop or Click</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG, WebP supported</p>
              </div>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleChange} 
            accept="image/jpeg,image/png,image/webp" 
            style={{ display: 'none' }} 
          />
        </div>
      )}
    </div>
  );
}
