import { Button, Input } from "antd";
import React, { useState } from "react";
const { TextArea } = Input;

export const OperatorInput = ({
  onComplete,
}: {
  onComplete: (input: string) => void;
}) => {
  const [value, setValue] = useState("");

  return (
    <div
      style={{
        width: "70vw",
        padding: "8px",
        marginBottom: "16px",
        borderRadius: "8px",
        border: "1px #eee solid",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <TextArea
        style={{
          width: "100%",
          border: "none",
          fontSize: "18px",
          resize: "none",
        }}
        rows={3}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        onClick={() => onComplete?.(value)}
        size="small"
        type="text"
        disabled={!value}
        style={{ margin: "12px 0 0 8px" }}
      >
        GO
      </Button>
    </div>
  );
};
