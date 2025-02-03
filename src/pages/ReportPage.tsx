"use client";
import React, { useState } from "react";
import { Button, Form, Input, Layout, Breadcrumb, message, Select, theme } from "antd";
import { uploadData } from 'aws-amplify/storage';
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const { TextArea } = Input;
const { Content, Footer } = Layout;

const client = generateClient<Schema>();
console.log(client);

const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null); // File state

  const handleFileChange = (event: any) => {
    setFile(event.target.files[0]); // Set the selected file
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      console.log("Submitting values:", values);

      const { name, description, category, location,} = values;



      // Check if file is selected, if so, upload to S3
      let filePath = "";
      if (file) {
        // Upload the file to S3
        const fileKey = `uploads/${Date.now()}_${file.name}`;
        filePath = fileKey;
        await uploadData({
          path: fileKey,
          data: file,
          options: {
            bucket: 'appdevlostnfoundbucket'
          }
        }).result;
      }

      // Log if client.models.LostItem is available
      console.log(client?.models?.LostItem);

      if (!client?.models?.LostItem) {
        throw new Error("LostItem model is not available in the client.");
      }

      // Make the API call to create a new lost item with lostItemId
      const newLostItem = await client.models.LostItem.create({
        name,
        description,
        category,
        location,
        imagepath: filePath,
      },
      {
        authMode: 'userPool',
      });

      console.log("Created new lost item:", newLostItem);

      message.success("Lost item added successfully!");
      form.resetFields(); // Clear the form after submission
    } catch (error) {
      console.error("Error adding lost item:", error);
      message.error("Failed to add lost item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Content style={{ padding: "0 48px" }}>
        <Breadcrumb style={{ margin: "16px 0" }}>
          <Breadcrumb.Item>Create Lost Item</Breadcrumb.Item>
        </Breadcrumb>
        <div
          style={{
            padding: 20,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Form
            form={form}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 14 }}
            layout="horizontal"
            onFinish={handleSubmit} // Handle form submission
          >
            <Form.Item
              label="Lost Item Name"
              name="name"
              rules={[{ required: true, message: "Please enter the lost item name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: "Please enter a description" }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Please select the category" }]}
            >
              <Select placeholder="Select a category">
                <Select.Option value="Electronics">Electronics</Select.Option>
                <Select.Option value="Clothing">Clothing</Select.Option>
                <Select.Option value="Documents">Documents</Select.Option>
                <Select.Option value="Jewelry">Jewelry</Select.Option>
                <Select.Option value="Other">Other</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Location Found"
              name="location"
              rules={[{ required: true, message: "Please enter where the item was found" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Item Image"
              valuePropName="fileList"
              getValueFromEvent={normFile}
            >
              <input type="file" onChange={handleFileChange} />
            </Form.Item>

            <Form.Item style={{ textAlign: "center" }}>
              <Button type="primary" htmlType="submit" loading={loading}>
                Add Lost Item
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Lost and Found Management ©{new Date().getFullYear()} Created by Yuanxin
      </Footer>
    </Layout>
  );
};

export default App;
