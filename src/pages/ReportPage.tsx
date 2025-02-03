"use client";
import React, { useState } from "react";
import { Button, Form, Input, Layout, Breadcrumb, message, Select, DatePicker, theme } from "antd";
import { uploadData } from "aws-amplify/storage";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import dayjs from "dayjs"; // Import dayjs for date formatting

const { TextArea } = Input;
const { Content, Footer } = Layout;

const client = generateClient<Schema>();

const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const ReportPage: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null); // File state
  const [showCustomCategory, setShowCustomCategory] = useState(false);


  const handleCategoryChange = (value: string) => {
    if (value === "Other") {
      form.setFieldsValue({ category: "" });
      setShowCustomCategory(true);
    }
  };

  const resetCategory = () => {
    setShowCustomCategory(false);
    form.setFieldsValue({ category: undefined }); // Reset the category field
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      console.log("Submitting values:", values);

      const { name, description, category, location, dateLost } = values;

      // Convert the DatePicker value into a string
      const formattedDateLost = dateLost ? dayjs(dateLost).format("YYYY-MM-DD") : "";

      // Check if a file is selected, then upload to S3
      let filePath = "";
      if (file) {
        const fileKey = `uploads/${Date.now()}_${file.name}`;
        filePath = fileKey;
        await uploadData({
          path: fileKey,
          data: file,
          options: {
            bucket: "appdevlostnfoundbucket",
          },
        }).result;
      }

      if (!client?.models?.LostItem) {
        throw new Error("LostItem model is not available in the client.");
      }

      // API call to create a new lost item
      const newLostItem = await client.models.LostItem.create(
        {
          name,
          description,
          category,
          location,
          date: formattedDateLost, // Ensure the date is passed as a string
          imagepath: filePath,
          isClaimed: false, // Set isClaimed to false by default
        },
        {
          authMode: "userPool",
        }
      );

      console.log("Created new lost item:", newLostItem);

      message.success("Lost item added successfully!");
      form.resetFields();
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
          <Breadcrumb.Item>Report Lost Item</Breadcrumb.Item>
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
            onFinish={handleSubmit}
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
              rules={[{ required: true, message: "Please select or enter a category" }]}
            >
              {showCustomCategory ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Input placeholder="Enter custom category" />
                  <Button 
                    type="link" 
                    onClick={resetCategory}
                    style={{ padding: 0, alignSelf: 'flex-start' }}
                  >
                    ← Back to categories
                  </Button>
                </div>
              ) : (
                <Select
                  placeholder="Select a category"
                  onChange={handleCategoryChange}
                >
                  <Select.Option value="Electronics">Electronics</Select.Option>
                  <Select.Option value="Clothing">Clothing</Select.Option>
                  <Select.Option value="Documents">Documents</Select.Option>
                  <Select.Option value="Jewelry">Jewelry</Select.Option>
                  <Select.Option value="Other">Other (Specify)</Select.Option>
                </Select>
              )}
            </Form.Item>


            <Form.Item
              label="Location Found"
              name="location"
              rules={[{ required: true, message: "Please enter where the item was found" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Date Lost"
              name="dateLost"
              rules={[{ required: true, message: "Please enter the date the item was lost" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Item Image" valuePropName="fileList" getValueFromEvent={normFile}>
              <input type="file" onChange={handleFileChange} accept="image/*" />
            </Form.Item>

            <Form.Item style={{ textAlign: "center" }}>
              <Button type="primary" htmlType="submit" loading={loading}>
                Report Lost Item
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

export default ReportPage;
