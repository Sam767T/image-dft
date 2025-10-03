import React, { useState, useRef } from "react";

// Very basic & inefficient DFT function
function dft(inputReal, inputImag) {
  const N = inputReal.length;
  const real = new Array(N).fill(0);
  const imag = new Array(N).fill(0);

  for (let k = 0; k < N; k++) {
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      // DFT of (inputReal[n] + i*inputImag[n])
      real[k] += inputReal[n] * Math.cos(angle) - inputImag[n] * Math.sin(angle);
      imag[k] += inputReal[n] * Math.sin(angle) + inputImag[n] * Math.cos(angle);
    }
  }
  return { real, imag };
}

// Normalise array for output to 8 bit image
function normaliseArray(arr) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    if (min === max) return arr.map(() => 0); // All values same, map to 0
    return arr.map(val => ((val - min) / (max - min)) * 255);
}

function ImageUpload() {
  const [image, setImage] = useState(null);
  const [alpha, setAlpha] = useState(1);
  const [magSqrt, setMagSqrt] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const manipulateImage = () => {
    setIsLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2])/3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      
      // Do horizontal DFT (DFT is separable)
      let stride = img.width * 4;
      let Xreal = [];
      let Ximag = [];

      for (let r = 0; r < img.height; r += 1) {
        let signal = [];
        for (let c = 0; c < (stride); c += 4) {
          let i = (r * stride) + c;
          signal.push(data[i]);
        }

        const imag = new Array(img.width).fill(0);
        let phasors = dft(signal, imag);

        for (let k = 0; k < phasors.real.length; k += 1) {
          Xreal.push(phasors.real[k]);
          Ximag.push(phasors.imag[k])
        }
      }

      // Vertical DFT from output of horizontal DFT
      stride = img.width;
      for (let c = 0; c < img.width; c += 1) {
        let signalReal = [];
        let signalImag = [];
        for (let r = 0; r < img.height; r += 1) {
          let i = (r * stride) + c;
          signalReal.push(Xreal[i])
          signalImag.push(Ximag[i])
        }
        let phasors = dft(signalReal, signalImag)

        for (let r = 0; r < img.height; r += 1) {
          let i = (r * stride) + c;
          Xreal[i] = phasors.real[r];
          Ximag[i] = phasors.imag[r];
        }
      }

      let mag = []; // Magnitude
      for (let j = 0; j < Xreal.length; j += 1) {
        let m = Math.sqrt(Xreal[j]*Xreal[j] + Ximag[j]*Ximag[j]);
        if (magSqrt) {
          m = Math.sqrt(m)
        }
        mag.push(Math.round(m));
      }

      let magn = normaliseArray(mag);
      let switchH = new Array(magn.length).fill(0);
      let out = new Array(magn.length).fill(0);

      // Rearrange quadrants
      let halfWidth = Math.floor(img.width / 2);
      for (let r = 0; r < img.height; r += 1) {
        for (let c = 0; c < img.width; c += 1) {
          let i = (r * stride) + c;
          let j = 0;
          if (c >= halfWidth) {
            j = (r * stride) + c - halfWidth;
          } else {
            j = (r * stride) + c + halfWidth;
          }
          switchH[i] = magn[j];
        }
      }

      let halfHeight = Math.floor(img.height / 2);
      for (let c = 0; c < img.width; c += 1) {
        for (let r = 0; r < img.height; r += 1) {
          let i = (r * stride) + c;
          let j = 0;
          if (r >= halfHeight) {
            j = ((r - halfHeight) * stride) + c;
          } else {
            j = ((r + halfHeight) * stride) + c;
          }
          out[i] = switchH[j];
        }
      }

      
      // Write magnitude response to canvas
      for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
        let pix = Math.round(alpha * out[j]); // Magnitude
        data[i] = pix;
        data[i + 1] = pix;
        data[i + 2] = pix;
      }
      setIsLoading(false);

      ctx.putImageData(imageData, 0, 0);
    };
  };

  return (
    <div>
      <h3>Upload and View Image</h3>
      <p><b>Note:</b> Images are not sent to any server - all processing is done locally in JS.</p>
      <p>Images larger than ~600x600px are unlikely to work with this non-FFT version.</p>
      <input type="file" accept="image/*" onChange={handleImageUpload} />

      {/* Show the image if it has been uploaded */}
      {image && (
        <div>
          <img src={image} alt="Uploaded" style={{ width: "400px" }} />
          <br />
          <h3>View DFT</h3>
          Scaling factor =
          <input
            type="number"
            value={alpha}
            min={0}
            style={{ width: "40px" }}
            onChange={e => setAlpha(Number(e.target.value))}
          />
          Show SQRT of Magnitude
          <input
            type="checkbox"
            checked={magSqrt}
            onChange={e => setMagSqrt(e.target.checked)}
          />
          <button onClick={manipulateImage}>Show DFT</button>

          <br />
          {isLoading && (<p>Calculating...</p>)}
          <canvas ref={canvasRef} style={{ marginTop: "1rem", width: "400px" }} />
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
