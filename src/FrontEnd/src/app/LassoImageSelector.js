'use-client'

import React, { useEffect, useState } from 'react';
import { ReactLassoSelect, getCanvas } from 'react-lasso-select';
import { Button, Container, Header, Sidebar, FlexboxGrid, Footer, InputNumber } from 'rsuite';

export default function LassoImageSelector({ videoName, backendUrl }) {
    const [points, setPoints] = useState([]);
    const [clippedImg, setClippedImg] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [transformedImages, setTransformedImages] = useState([]);

    const [width, setWidth] = useState(1)
    const [depth, SetDepth] = useState(1)

    const submitSelection = async (save_for) => {
        if (!videoName || points.length !== 4 || !width || !depth) {
            console.warn("Must select a video and exactly 4 points.");
            return;
        }

        const payload = {
            video_name: videoName,
            points: points,
            width: width,
            depth: depth,
            save_for: save_for
        };

        try {
            const res = await fetch(backendUrl+"/save-selection", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setTransformedImages(data.images);
            console.log("✅ Saved:", res);
        } catch (err) {
            console.error("❌ Failed to save points:", err);
        }
    };

    // Fetch the first image when the component mounts
    const configCamera = async () => {
        try {
            const res = await fetch(backendUrl+`/original_image?video_name=${videoName}`);
            const data = await res.json();

            if (data.images && data.images.length > 0) {
                const firstImage = data.images[0].image;
                setImageSrc(`data:image/jpeg;base64,${firstImage}`);
            }
        } catch (err) {
            console.error('Failed to fetch image:', err);
        }
    }

    return (
        <Container style={{ margin: '10px' }}>
            <Header>
                <Button
                    color="blue"
                    appearance='primary'
                    onClick={() => configCamera()}>
                    Configure Camera
                </Button>
            </Header>
            <Container style={{ margin: '10px' }}>
                <label>Estimated width in Meters:</label>
                <InputNumber
                    style={{ width: '300px' }}
                    value={width}
                    onChange={setWidth}
                />
                <label>Estimated depth in Meters:</label>
                <InputNumber
                    style={{ width: '300px' }}
                    value={depth}
                    onChange={SetDepth}
                />
                <FlexboxGrid>
                    <FlexboxGrid.Item style={{ margin: '10px' }} >
                        {imageSrc && (
                            <>
                                <h6>Original:</h6>
                                <ReactLassoSelect
                                    imageStyle={{ width: '750px' }}
                                    style={{ width: '750px' }}
                                    value={points}
                                    src={imageSrc}
                                    onChange={(value) => setPoints(value)}
                                    onComplete={(value) => {
                                        if (!value.length) return;
                                        getCanvas(imageSrc, value, (err, canvas) => {
                                            if (!err) {
                                                setClippedImg(canvas.toDataURL());
                                            }
                                        });
                                    }}
                                />

                            </>
                        )}
                    </FlexboxGrid.Item>
                    <FlexboxGrid.Item style={{ margin: '10px' }} >{clippedImg && (
                        <div>
                            <h6>Clipped Image Preview:</h6>
                            <img src={clippedImg} alt="Clipped" style={{ width: '400px' }} />
                        </div>
                    )}</FlexboxGrid.Item>
                </FlexboxGrid>

                <Footer style={{ margin: '10px' }}>
                    <div>
                        <p>Points:</p>
                        <pre>{points.map(({ x, y }) => `(${x}, ${y})`).join(', ')}</pre>
                    </div>
                    <Button 
                        color="green" 
                        appearance='primary' 
                        style={{ margin: '5px', width: '200px' }} 
                        onClick={() => submitSelection('density')}
                    >
                        Save Config (Density)
                    </Button>
                    <Button 
                        color="green" 
                        appearance='primary' 
                        style={{ margin: '5px', width: '200px' }} 
                        onClick={() => submitSelection('optical_flow')}
                    >
                        Save Config (Optical Flow)
                    </Button>
                </Footer>
            </Container>
            <Container style={{ margin: '10px' }}>
                {transformedImages.length > 0 && (
                    <div>
                        <h6>TransformedImage:</h6>
                        <img src={transformedImages[0].image} alt={transformedImages[0].filename} width={750} />
                    </div>
                )}
            </Container>


        </Container >
    );
}
