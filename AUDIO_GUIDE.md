# 🎵 Custom Audio Guide for CartRuns Onboarding

## 🎯 Quick Setup

### Option 1: Use Your Own Audio File

1. **Add your audio file** to the `public` folder:

   ```
   public/
   ├── your-cooking-sound.mp3
   ├── ambient-cooking.js
   └── vite.svg
   ```

2. **Update the audio source** in `src/components/Onboarding.tsx`:
   ```tsx
   <source src="/your-cooking-sound.mp3" type="audio/mpeg" />
   ```

### Option 2: Use Free Online Sounds

Replace the audio sources with these free cooking/kitchen ambient sounds:

#### 🍳 Cooking & Kitchen Ambience

```tsx
{
  /* Gentle kitchen ambience */
}
<source
  src="https://www.freesoundslibrary.com/wp-content/uploads/2017/04/cooking-sounds-effect.mp3"
  type="audio/mpeg"
/>;

{
  /* Restaurant kitchen background */
}
<source
  src="https://www.freesoundslibrary.com/wp-content/uploads/2018/02/restaurant-kitchen-ambience.mp3"
  type="audio/mpeg"
/>;

{
  /* Light cooking sounds */
}
<source
  src="https://www.freesoundslibrary.com/wp-content/uploads/2017/11/kitchen-cooking-ambience.mp3"
  type="audio/mpeg"
/>;
```

## 🎛️ Audio Settings

### Volume Control

```tsx
audioRef.current.volume = 0.15; // 15% volume (gentle background)
```

### Loop Settings

```tsx
<audio loop> // Repeats continuously
```

### Format Support

- **MP3**: Best compatibility
- **WAV**: High quality, larger files
- **OGG**: Good compression, modern browsers

## 🔧 Advanced Customization

### Switch Between Generated vs Custom Audio

```tsx
const [useCustomAudio, setUseCustomAudio] = useState(true);
```

### Custom Fallback Behavior

If your audio file fails to load, the system automatically falls back to generated ambient tones.

## 📁 Recommended Audio Specs

- **Duration**: 2-5 minutes (will loop)
- **Volume**: Pre-normalized to comfortable listening level
- **Format**: MP3 (44.1kHz, 128-192 kbps)
- **Style**: Ambient, non-distracting, cooking/kitchen themed

## 🎵 Free Sound Resources

- **Freesound.org**: High-quality creative commons sounds
- **Free Sounds Library**: No attribution required
- **YouTube Audio Library**: Free background music
- **Adobe Audition**: Free sound effects (with Creative Cloud)

## 🚨 Browser Considerations

- Modern browsers require user interaction before playing audio
- The system handles autoplay restrictions gracefully
- Mobile browsers may have additional limitations
