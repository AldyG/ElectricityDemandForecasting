'use client'

import React, { useRef, useState, useEffect } from "react";
import VideoPlayer from "./VideoPlayer"; // Adjust path as needed
import { InputPicker, Button, Container, Header, Content, Footer, Sidebar, RadioGroup, Radio, Stack, InputNumber } from 'rsuite';
import LassoImageSelector from "./LassoImageSelector";

export default function FramePlayer() {
    const [mounted, setMounted] = useState(false);

    const [bboxFrames, setBboxFrames] = useState([]);
    const [pointFrames, setPointFrames] = useState([]);
    const [transPointFrames, setTransPointFrames] = useState([]);
    const [fidtFrames, setFidtFrames] = useState([]);
    const [combFrames, setCombFrames] = useState([]);
    const [opticalFlowFrames, setOpticalFlowFrames] = useState([]); // New state for optical flow

    const [totalFrames, setTotalFrames] = useState(0)
    const [currentIndex, setCurrentIndex] = useState(0);
    const [videoFrameRate, setVideoFrameRate] = useState(1);

    const [currentView, setCurrentView] = useState('Combined')
    const frameSources = {
        Combined: combFrames,
        DotMap: pointFrames,
        TransformedDotMap: transPointFrames,
        FidtMap: fidtFrames,
        BBoxImage: bboxFrames,
        OpticalFlow: opticalFlowFrames, // Added optical flow
    };

    const [modelType, setModelType] = useState("NWPU");
    const [videoSource, setVideoSource] = useState("");
    const [videoOptions, setVideoOptions] = useState([]);

    const fileInputRef = useRef(null);
    const [videoFile, setVideoFile] = useState(null);
    const [uploadFrameRate, setUploadFrameRate] = useState(1)

    const model_options = [
        "JHU",
        "NWPU",
        "QNRF",
        "ShanghaiA",
        "ShanghaiB",
    ].map(item => ({ label: item, value: item }));

    // Use http://127.0.0.1:8000 for local usage and 10.28.229.17:8000 for usage with server
    const backendUrl = 'http://127.0.0.1:8000';
    // const backendUrl = 'http://10.28.229.17:8000';

    const fetchVideos = async () => {
        try {
            const res = await fetch(backendUrl+'/available-videos');
            const data = await res.json();
            console.log("Available videos:", data);

            const options = data.videos.map((videoName) => ({
                label: videoName,
                value: videoName
            }));

            setVideoOptions(options);
        } catch (err) {
            console.error("Failed to fetch available videos:", err);
        }
    };


    useEffect(() => {
        fetchVideos();
    }, []);

    const uploadVideo = async () => {
        if (!videoFile) return;

        let videoName = ''
        const formData = new FormData();
        formData.append("video", videoFile);

        try {
            const res = await fetch(backendUrl+'/upload-video', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            console.log("Response:", data);

            if (data.video_name) {
                const newOption = { label: data.video_name, value: data.video_name };

                setVideoOptions(prev => {
                    // Avoid duplicates
                    const exists = prev.some(opt => opt.value === newOption.value);
                    return exists ? prev : [...prev, newOption];
                });

                // Auto-select uploaded video
                setVideoSource(data.video_name);
                videoName = data.video_name
            }

        } catch (err) {
            console.error("Upload error:", err);
        }

        try {
            const res = await fetch(backendUrl+`/extract-frames?video_name=${videoName}&frame_rate=${uploadFrameRate}`);
            const data = await res.json();


        } catch (err) {
            console.error("Failed to extract frames:", err);
        }

    };

    // Fetch optical flow frames from backend in chunks
    const fetchOpticalFlowFrames = async (start = 0, limit = 50, append = false) => {
        // Ensure start is always a valid integer
        start = Number.isInteger(start) && start >= 0 ? start : 0;
        limit = Number.isInteger(limit) && limit > 0 ? limit : 50;
        if (!videoSource) return;
        try {
            const res = await fetch(backendUrl+`/optical-flow-results?video_name=${encodeURIComponent(videoSource)}&start=${start}&limit=${limit}`);
            const data = await res.json();
            // Assume data.frames is an array of { frameId, image }
            if (append) {
                setOpticalFlowFrames(prev => [...prev, ...(data.frames || [])]);
            } else {
                setOpticalFlowFrames(data.frames || []);
            }
            // Optionally set totalFrames and videoFrameRate if provided
            if (data.max_frames) setTotalFrames(data.max_frames);
            if (data.frame_rate) setVideoFrameRate(data.frame_rate);
            // If there are more frames, fetch next chunk automatically
            if (data.frames && data.frames.length === limit && (start + limit) < (data.max_frames || 0)) {
                fetchOpticalFlowFrames(start + limit, limit, true);
            }
        } catch (err) {
            console.error("Failed to fetch optical flow frames:", err);
        }
    };

    const calOpticalFlow = async () => {
        if (!videoSource) {
            console.warn("No video source selected");
            return;
        }

        try {
            // Optionally, set a loading state here
            const res = await fetch(backendUrl+`/calculate-optical-flow?video_name=${encodeURIComponent(videoSource)}`);
            const data = await res.json();

            if (res.ok) {
                console.log("Optical flow calculation started/completed:", data.message || data);
                alert("Optical flow calculation completed.");
                fetchOpticalFlowFrames(); // Fetch and display optical flow frames after calculation
            } else {
                console.error("Optical flow calculation failed:", data.error || data);
                alert("Optical flow calculation failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Error calling optical flow endpoint:", err);
            alert("Error calling optical flow endpoint.");
        }
    };

    const streamFrames = async () => {
        if (!videoSource) {
            console.warn("Missing video source");
            return;
        }

        console.log("Starting stream for", videoSource);

        console.log(modelType)

        const eventSource = new EventSource(
            backendUrl+`/stream-frames?video_name=${videoSource}&model_type=${modelType}`
        );

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error("Stream error:", data.error);
                eventSource.close();
                return;
            }

            if (data.status === "complete") {
                console.log("✅ Stream complete");
                eventSource.close();  // Clean up
                return;
            }

            const { frameId, images, max_frames, frame_rate } = data;
            const { comb, bbox, point, trans_point, fidt } = images;
            setTotalFrames(max_frames)
            setVideoFrameRate(frame_rate)

            setCombFrames(prev => [...prev, { frameId, image: comb }]);
            setBboxFrames(prev => [...prev, { frameId, image: bbox }]);
            setPointFrames(prev => [...prev, { frameId, image: point }]);
            setTransPointFrames(prev => [...prev, { frameId, image: trans_point }]);
            setFidtFrames(prev => [...prev, { frameId, image: fidt }]);

            console.log(`Received frame ${frameId}`);
        };

        eventSource.onerror = (err) => {
            console.error("SSE connection failed:", err);
            eventSource.close();
        };

        return () => eventSource.close();
    };

const deleteFolder = async (onlyPrediction) => {
        if (!videoSource) return;

        try {
            const res = await fetch(backendUrl+`/delete-folder/?video_name=${(videoSource)}&only_prediction=${(onlyPrediction)}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            console.log("Delete response:", data);

            if (res.ok) {
                console.log("Folder deleted successfully.");
                // Optionally update UI or state here
                fetchVideos()
            } else {
                console.error(`Error: ${data.message}`);
            }

        } catch (err) {
            console.error("Folder deletion failed:", err);
            alert("Failed to delete folder.");
        }
    };

    
    const startStream = async () => {
        setCombFrames([]);
        setBboxFrames([]);
        setPointFrames([]);
        setTransPointFrames([]);
        setFidtFrames([]);
        setOpticalFlowFrames([]); // Clear optical flow frames on new stream
        streamFrames()

    }

    useEffect(() => {
        setMounted(true);
    }, []);

    // Example function to fetch/set optical flow frames (implement as needed)
    // const fetchOpticalFlowFrames = async () => {
    //     const response = await fetch('/api/optical-flow-results');
    //     const data = await response.json();
    //     setOpticalFlowFrames(data.frames);
    // };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-4 p-4">
            <Container>
                <Header style={{ margin: '10px' }}><h3 className="text-xl font-bold">Video Player</h3></Header>
                <Header style={{ margin: '10px' }}>
                    <h6>Predict on Video</h6>

                    <InputPicker
                        data={model_options}
                        style={{ width: 224 }}
                        onChange={setModelType}
                        value={modelType}
                    />

                    <InputPicker
                        style={{ margin: '5px', width: 224 }}
                        data={videoOptions}
                        onChange={setVideoSource}
                        placeholder="Select video source"
                    />
                    
                    <div style={{ marginTop: '10px' }}>
                        <Button
                            color="green" appearance='primary'
                            style={{ margin: '5px' }}
                            onClick={startStream}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Calculate Density
                        </Button>
                        <Button
                            color="green" appearance='primary'
                            style={{ margin: '5px' }}
                            onClick={calOpticalFlow}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Calculate Optical Flow
                        </Button>
                        <Button
                            style={{ margin: '5px' }}
                            color="red" appearance='primary'
                            onClick={() => deleteFolder(false)}
                            disabled={!videoSource}
                            className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
                        >
                            Delete Video
                        </Button>
                        <Button
                            style={{ margin: '5px' }}
                            color="red" appearance='primary'
                            onClick={() => deleteFolder(true)}
                            disabled={!videoSource}
                            className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
                        >
                            Delete Prediction
                        </Button>
                        <Button
                            color="orange" appearance='primary'
                            style={{ margin: '5px' }}
                            onClick={fetchOpticalFlowFrames}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Fetch Optical Flow
                        </Button>
                    </div>

                </Header>
                <Container style={{ margin: '10px' }}>
                    <Content>
                        <VideoPlayer
                            frames={frameSources[currentView] || []}
                            currentIndex={currentIndex}
                            setCurrentIndex={setCurrentIndex}
                            totalFrames={totalFrames}
                            videoFrameRate={videoFrameRate}
                        />
                    </Content>
                    <Sidebar>
                        <Container style={{ margin: '10px' }}>
                            <h6>Select View</h6>
                            <RadioGroup name="radio-group" defaultValue="Combined" onChange={setCurrentView}>
                                <Radio value="Combined">Combined</Radio>
                                <Radio value="DotMap">DotMap</Radio>
                                <Radio value="TransformedDotMap">TransformedDotMap</Radio>
                                <Radio value="FidtMap">FidtMap</Radio>
                                <Radio value="BBoxImage">BBoxImage</Radio>
                                <Radio value="OpticalFlow">Optical Flow</Radio>
                            </RadioGroup>
                        </Container>
                    </Sidebar>
                </Container>
                <Container style={{ margin: '10px' }}>
                    <h6>Upload New Video</h6>

                    <Footer>
                        <input
                            type="file"
                            accept="video/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setVideoFile(e.target.files[0]);
                                }
                            }}
                        />
                        <Stack>
                            <label>Select target Framerate for extraction:</label>
                            <InputNumber
                                value={uploadFrameRate}
                                onChange={setUploadFrameRate}
                            />
                        </Stack>
                        <Button
                            color="green" appearance='primary'
                            style={{ width: '100px' }}
                            onClick={uploadVideo}
                            disabled={!videoFile}
                            className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
                        >
                            Upload
                        </Button>
                    </Footer>
                </Container>
                <Container style={{ margin: '10px' }}>
                    <h6>Configure selected Videocamera</h6>

                    <LassoImageSelector videoName={videoSource} backendUrl={backendUrl}/>
                </Container>
            </Container>




        </div>
    );
}
