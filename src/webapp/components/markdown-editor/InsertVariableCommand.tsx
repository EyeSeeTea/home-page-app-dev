import React, { useState, useRef, useEffect } from "react";
import { Command, TextApi } from "react-mde";
import { contentVariables } from "../../utils/contentVariables";

const VariableDropdown: React.FC<{ onClick: (value: string) => void }> = ({ onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleSelect = (value: string) => {
        onClick(value);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
            <button
                type="button"
                onClick={() => {
                    // Let the click propagate so react-mde runs `execute` and gives us textApi.
                    setIsOpen(o => !o);
                }}
                style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "5px 10px",
                    fontWeight: "bold",
                }}
                title="Insert Variable"
            >
                {"{ }"}
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        zIndex: 1000,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        minWidth: "200px",
                        marginTop: "4px",
                    }}
                >
                    {contentVariables.map(({ label, value }) => (
                        <div
                            key={value}
                            onClick={() => handleSelect(value)}
                            style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const useInsertVariableCommand = (): Command => {
    const textApiRef = useRef<TextApi | null>(null);

    return {
        icon: () => (
            <VariableDropdown
                onClick={value => {
                    if (textApiRef.current) {
                        textApiRef.current.replaceSelection(value);
                    }
                }}
            />
        ),
        execute: ({ textApi }) => {
            // This runs when the toolbar button is clicked (if we don't stop propagation)
            textApiRef.current = textApi;
        },
    };
};
