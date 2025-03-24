"use client";
import { Space } from "antd";
import React, { useState } from "react";
import { OperatorInput, Puppeteer, LLMCheck, Steps } from "./components";
import { ISteps } from "./components/Steps";

export const Operator = () => {
  const [userInput, setUserInput] = useState<string>("");
  const [steps, setSteps] = useState<ISteps[]>([]);

  return (
    <div
      style={{
        width: "100%",
        paddingTop: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Space align="center" direction="vertical">
        <h2>Easy Operator</h2>
        <h3>Just Tell Me What Do You Want To Do</h3>
        <LLMCheck />
        <OperatorInput onComplete={(input) => setUserInput(input)} />
        <Puppeteer
          userInput={userInput}
          onAddSteps={(e: ISteps[]) =>
            setSteps((preSteps) => {
              return [...preSteps, ...e];
            })
          }
        />
        <Steps steps={steps} />
      </Space>
    </div>
  );
};

export default Operator;
