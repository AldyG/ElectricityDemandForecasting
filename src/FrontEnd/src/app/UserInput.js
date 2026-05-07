'use client'

import React, { useRef, useState, useEffect } from "react";
import { InputPicker, Button, Container, Header, Content, Footer, Sidebar, RadioGroup, Radio, Stack, InputNumber } from 'rsuite';

export default function FramePlayer() {
    const [mounted, setMounted] = useState(false);

    const backendUrl = 'http://127.0.0.1:8000';
    // const backendUrl = 'http://10.28.229.17:8000';

    const [testState, setTestState] = useState("Yes");


    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-4 p-4">
            <Container>
                <Header style={{ margin: '10px' }}><h3 className="text-xl font-bold">Electricity Demand Forecasting</h3></Header>
                <Header style={{ margin: '10px' }}>
                    <h6>Please put in your data</h6>

                    <InputPicker
                        data={["No", "Yes"].map(item => ({ label: item, value: item }))}
                        style={{ width: 224 }}
                        onChange={setTestState}
                        value={testState}
                    />

                </Header>

            </Container>




        </div>
    );
}
