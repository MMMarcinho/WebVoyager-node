import React from "react";
import { Alert, Flex, Tag, Collapse } from "antd";

export const LLMCheck = () => {
  const items = [
    {
      key: "1",
      label: "LLM Service",
      children: (
        <Alert
          style={{ width: "100%" }}
          message={<h3>Check Your LLM Service Availability</h3>}
          description={
            <Flex vertical gap={8}>
              <span>1. API KEY: {process.env.NEXT_PUBLIC_LLM_API_KEY}</span>
              <span>2. API URL: {process.env.NEXT_PUBLIC_LLM_API_URL}</span>
              <span>3. Model: {process.env.NEXT_PUBLIC_LLM_MODEL}</span>
              <Flex gap={8}>
                <>Static Config Availability: </>
                <Tag color="success">pass</Tag>
              </Flex>
            </Flex>
          }
          type="info"
        />
      ),
    },
  ];
  return (
    <Collapse
      style={{ width: "70vw" }}
      defaultActiveKey={[""]}
      ghost
      items={items}
    />
  );
};
