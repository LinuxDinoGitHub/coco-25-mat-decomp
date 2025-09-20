import React, { useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});
const prompt_struct = ""

export default function modelHandler( setCoords , image , ) {
    useEffect(() => {
        const base64ImageFile = fs.readFileSync(image, {
        encoding: "base64",
        });

        const contents = [
            {
                inlineData: {
                mimeType: "image/jpeg",
                data: base64ImageFile,
                },
            },
            { text: "Caption this image." },
        ];

        const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        });
        console.log(response.text);
    }, []);
    return (
        <div className={styles.page}>
        <SpeedInsights/>
        
        </div>
    );
}
