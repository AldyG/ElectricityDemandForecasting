'use client'

import React, { useState, useEffect, useRef } from "react";
import { Button, Image, Placeholder } from "rsuite"; // Optional

// const FRAME_RATE = 1; // Frames per second

export default function VideoPlayer({ frames, totalFrames, videoFrameRate }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef(null);

    const [zoomLevel, setZoomLevel] = useState(1);

    const increaseZoom = () => setZoomLevel((z) => Math.min(z + 0.1, 3)); // Max 3x
    const decreaseZoom = () => setZoomLevel((z) => Math.max(z - 0.1, 0.1)); // Min 0.1x


    const play = () => {
        if (!intervalRef.current && totalFrames > 0) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex(prev =>
                    prev < totalFrames - 1 ? prev + 1 : 0
                );
            }, 1000 / videoFrameRate);
        }
        setIsPlaying(true);
    };

    const pause = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPlaying(false);
    };

    const togglePlay = () => {
        isPlaying ? pause() : play();
    };

    const goToFrame = (index) => {
        pause();
        setCurrentIndex(index);
    };

    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    const currentFrame = frames[currentIndex];

    return (
        <div className="flex flex-col items-center gap-4">
            <div>
                {currentFrame ? (
                    <img
                        src={`data:image/jpeg;base64,${currentFrame.image}`}
                        alt={`Frame ${currentFrame.frameId}`}
                        style={{
                            width: `${750 * zoomLevel}px`,
                            height: "auto",
                            transition: "width 0.3s ease",
                        }}
                        className="max-w-full"
                    />
                ) : (
                    <Image
                        width={750 * zoomLevel}
                        height={400 * zoomLevel}
                        src={'https://placehold.co/750x400'}
                        alt="black and white short coated dog"
                        style={{ transition: "width 0.3s ease" }}
                    />
                )}
            </div>

            <div className="flex gap-4 items-center mt-2">
                <Button onClick={() => goToFrame(Math.max(currentIndex - 1, 0))} disabled={currentIndex === 0}>
                    Prev
                </Button>
                <Button onClick={togglePlay}>
                    {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                    onClick={() => goToFrame(Math.min(currentIndex + 1, totalFrames - 1))}
                    disabled={currentIndex === totalFrames - 1}
                >
                    Next
                </Button>
            </div>
            <input
                type="range"
                min={0}
                max={totalFrames - 1}
                value={currentIndex}
                onChange={(e) => goToFrame(Number(e.target.value))}
                className="w-full max-w-md mt-2"
            />
            <div className="text-center mt-2">
                <p>Frame {currentIndex + 1} / {totalFrames}</p>
                <p>FrameRate: {videoFrameRate}</p>
            </div>
            <div className="flex gap-2 items-center mt-4">
                <Button onClick={decreaseZoom}>-</Button>
                <span>Zoom: {zoomLevel.toFixed(1)}x</span>
                <Button onClick={increaseZoom}>+</Button>
                <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                    className="w-40"
                />
            </div>
        </div>
    );
}
