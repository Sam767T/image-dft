To deploy to Github Pages, run `npm run deploy`. To run development build, run `npm start`.

# Image DFT
You can use the **image-dft** tool here: [sam767t.github.io/image-dft/](https://sam767t.github.io/image-dft/)

Below are some basic notes on the DFT and 2D variant in particular. You should not attempt to learn about the DFT from scratch using this document.

## Discrete Fourier Transform (DFT)

The DFT transforms a discrete signal $x[n]$ into a discrete frequency spectrum $X[k]$. Mathematically, it is defined as:

```math
\begin{equation*}
    \begin{split}
        X[k] &= \sum_{n=0}^{N-1} x[n] \cdot e^{-j\frac{2\pi kn}{N}} \\
            &= \sum_{n=0}^{N-1} x[n] \cdot \left[ cos\left(\frac{-2\pi kn}{N}\right) + j sin \left(\frac{-2\pi kn}{N}\right)  \right]
    \end{split}
\end{equation*}
```

Where:

- $x[n]$ is the value of an input signal at coordinate $n$
- $X[k]$ is the $k^{th}$ frequency bin of the spectrum
- $N$ is the length of $x[n]$ (and $X[k]$)
- $j$ is the imaginary unit $(j = \sqrt{-1})$

From $X[k]$, the magnitude $|X[k]|$ and phase $\angle X[k]$ responses can be calculated. The former shows which frequencies are present in a signal, whilst the latter indicates the phase delay of each frequency bin.

Only the magnitude response $|X[k]| = \sqrt{\Re(X[k])^2+\Im(X[k])^2}$ is shown on **image-dft**.

### Interpretation of the DFT

In one dimension, $x[n]$ will typically represent a sampled time signal (e.g. an audio signal). If the corresponsing DFT $X[k]$ exhibits relatively large amplitudes in the lowest frequency bins, then low frequencies are dominant in the audio signal.

A DFT is double-sided (or mirrored), so one half of the DFT will be a reflection of the other. The lowest frequency bin $X[0]$ represents DC gain and is the only bin which is not mirrored.

## 2D DFT

Whilst a 1D signal is typically an audio signal in DSP, a 2D signal is typically realised as an image. A 2D DFT is simply a 1D DFT performed in both directions (vertical and horizontal, one after the other), since the DFT has the property of being separable.

Just like in the 1D DFT, if most frequency content is near the origin in the 2D frequency plane, then it can be said that spatial low frequencies dominate the image.
