"use client";
import { Space, Divider } from "antd";
import React, { useState } from "react";
import { OperatorInput, Puppeteer, LLMCheck, Steps } from "./components";
import { ISteps } from "./components/Steps";

export const Operator = () => {
  const [userInput, setUserInput] = useState<string>(
    "Find the Birthday of Cristiano Ronaldo"
  );
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
        <Divider />
        <Puppeteer
          userInput={userInput}
          onAddSteps={(e: ISteps[]) =>
            setSteps((preSteps) => {
              return [...preSteps, ...e];
            })
          }
        />
        <OperatorInput
          val={userInput}
          onComplete={(input) => setUserInput(input)}
        />
        <Steps steps={steps} />
        <LLMCheck />
      </Space>
    </div>
  );
};

export default Operator;
