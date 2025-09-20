'use client';

import { React, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";


export default function ModelHandler({ setCoords, image, setLoading }) {
    const ai = new GoogleGenAI({apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});
    const isMounted = useRef(false);

    useEffect(() => {
        const processImage = async (imageFile) => {
            setLoading(true);
            const reader = new FileReader();
            
            reader.onloadend = async () => {
                const base64ImageFile = reader.result.split(',')[1]; // Get the base64 string without the metadata

                const contents = [
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64ImageFile,
                        },
                    },
                    { text: "Describe the object in this image with 10 words or less." },
                ];

                try {
                    const response_imageName = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: contents,
                    });

                    console.log("Image Description:", response_imageName.text);

                    const response_imageMaterial = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: "What are the materials of this object, in the response strictly only return a list in a 2d array structure as [[material, most likely production place],[material2, ...],...], maximum 5 materials, minimum 1. The object is: " + response_imageName.text,
                    });

                    console.log("Image Materials:", response_imageMaterial.text);

                    const response_coords = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: "What are the coordinates of the places in the array: " + response_imageMaterial.text + " in the format [[place, latitude, longitude],[place2, latitude2, longitude2],...], strictly only return a list in a 2d array structure",
                    });
                    console.log("Coordinates:", response_coords.text);
                    setCoords(response_coords.text);
                } catch (error) {
                    setCoords("Error: " + error.message);
                } finally {
                    setLoading(false);
                }
            };

            reader.readAsDataURL(imageFile); // Read the image file as a data URL
        };

        if (isMounted.current) {
            const imageFile = image; // Ensure `image` is a File object
            if (imageFile) {
                processImage(imageFile);
            }
        } else {
            isMounted.current = true; // Mark as mounted
        }
    }, [image]);

    return <div />;
}