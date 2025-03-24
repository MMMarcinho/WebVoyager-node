import React, { useState, useEffect } from "react";
import { List, Typography } from "antd";

export interface ISteps {
  think?: string;
  action?: string;
}

export const Steps = ({ steps }: { steps: ISteps[] }) => {
  const [stepList, setStepList] = useState<ISteps[]>([]);
  useEffect(() => {
    setStepList(steps);
  }, [steps]);

  if (!steps.length) {
    return null;
  }

  return (
    <List
      header={<div>Planned Steps</div>}
      footer={null}
      bordered
      style={{ width: "70vw", marginTop: "16px" }}
      dataSource={stepList}
      renderItem={(item, index) => (
        <List.Item>
          <Typography.Text mark>[{index}]</Typography.Text> Think: {item.think}{" "}
          Action: {item.action}
        </List.Item>
      )}
    />
  );
};
