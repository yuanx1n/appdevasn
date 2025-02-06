import React, { useState } from "react";
import { Button, Form, Input, Layout, Breadcrumb, message, DatePicker, Upload, theme } from "antd";
import { uploadData } from "aws-amplify/storage";
import { Predictions } from '@aws-amplify/predictions';

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
  const [detectedCategory, setDetectedCategory] = useState<string | undefined>();
  const [imageAnalyzed, setImageAnalyzed] = useState(false); // New state for image analysis

  const analyzeImage = async (file: File) => {
    try {
      message.loading("Analyzing image...");
      const labels = await Predictions.identify({
        labels: {
          source: {
            file,
          },
          type: "LABELS",
        },
      });

      console.log("Detected labels:", labels);

      // Ensure labels exist before accessing properties
      const detectedLabels = labels?.labels ?? []; // Fallback to an empty array if labels are undefined

      if (detectedLabels.length > 0) {
        const bestLabel = detectedLabels[0].name; // Pick the most relevant label
        setDetectedCategory(bestLabel);
        form.setFieldsValue({ category: bestLabel });
        message.success(`Detected category: ${bestLabel}`);
        setImageAnalyzed(true); // Mark as analyzed
      } else {
        message.warning("No labels detected. Please select a category manually.");
        setImageAnalyzed(false); // Reset analysis status if no labels detected
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      message.error("Failed to analyze image.");
      setImageAnalyzed(false); // Reset analysis status on failure
    }
  };

  const handleFileChange = async (info: any) => {
    const { fileList } = info;
    if (fileList.length > 0) {
      const selectedFile = fileList[0].originFileObj;
      setFile(selectedFile);
      setImageAnalyzed(false); // Reset analysis status when a new file is uploaded
      await analyzeImage(selectedFile); // Run AI label detection
    } else {
      setFile(null);
      setDetectedCategory(undefined);
      setImageAnalyzed(false); // Reset analysis status when no file is selected
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      // Validate if file is selected and image analysis has completed
      if (!file) {
        message.error("Please upload an image of the item.");
        return;
      }
      if (!imageAnalyzed) {
        message.error("Please wait for the image to be analyzed before submitting.");
        return;
      }

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
      } else {
        throw new Error("File is required.");
      }

      if (!client?.models?.LostItem) {
        throw new Error("LostItem model is not available in the client.");
      }

      // API call to create a new lost item
      const newLostItem = await client.models.LostItem.create(
        {
          name,
          description,
          category: detectedCategory || category,
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
      setFile(null);
      setDetectedCategory(undefined);
      setImageAnalyzed(false); // Reset analysis status after successful submission
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
              rules={[{ required: true, message: "Please enter the lost item name" }]}>

              <Input />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: "Please enter a description" }]}>

              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              label="Location Found"
              name="location"
              rules={[{ required: true, message: "Please enter where the item was found" }]}>

              <Input />
            </Form.Item>

            <Form.Item
              label="Date Lost"
              name="dateLost"
              rules={[{ required: true, message: "Please enter the date the item was lost" }]}>

              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Item Image"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: "Please upload an image of the item" }]}>

              <Upload
                customRequest={() => {}}
                onChange={handleFileChange}
                beforeUpload={() => false} // Prevent default upload behavior
                showUploadList={false}
                accept="image/*">

                <Button>Upload Image</Button>
              </Upload>
            </Form.Item>

            <Form.Item style={{ textAlign: "center" }}>
              <Button type="primary" htmlType="submit" loading={loading} disabled={!imageAnalyzed}>
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
