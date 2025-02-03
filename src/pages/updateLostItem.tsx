import React, { useState, useEffect } from "react";
import { Modal, Form, Input, message, Select, DatePicker, Switch } from "antd";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { uploadData } from "aws-amplify/storage";
import dayjs from "dayjs";

const { TextArea } = Input;

const client = generateClient<Schema>();

interface UpdateLostItemProps {
  item: {
    id: string;
    name: string;
    description: string;
    category: string;
    location: string;
    date: string;
    imagePath: string;
    isClaimed: boolean;
    claimedBy: string;
    claimedDate: string;
  };
  onItemUpdated: () => void;
  onCancel: () => void;
}

const UpdateLostItem: React.FC<UpdateLostItemProps> = ({ item, onItemUpdated, onCancel }) => {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      category: item.category,
      location: item.location,
      dateLost: dayjs(item.date),
      isClaimed: item.isClaimed,
      claimedBy: item.claimedBy,
      claimedDate: item.claimedDate ? dayjs(item.claimedDate) : null,
      imagePath: item.imagePath
    });
  }, [form, item]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target.files;
    if (fileInput && fileInput[0]) {
      setFile(fileInput[0]);
    }
  };

  const handleSubmit = async (values: any) => {
    setConfirmLoading(true);

    try {
      const { 
        name, 
        description, 
        category, 
        location, 
        dateLost, 
        isClaimed,
        claimedBy,
        claimedDate
      } = values;

      const formattedDateLost = dateLost ? dayjs(dateLost).format("YYYY-MM-DD") : "";
      const formattedClaimedDate = isClaimed && claimedDate ? 
        dayjs(claimedDate).format("YYYY-MM-DD") : 
        null;

      // Handle file upload
      let filePath = item.imagePath;
      if (file) {
        const fileKey = `lost-items/${Date.now()}_${file.name}`;
        filePath = fileKey;
        await uploadData({
          path: fileKey,
          data: file,
          options: {
            bucket: "appdevlostnfoundbucket",
          },
        }).result;
      }

      // Prepare update data
      const updateData = {
        id: item.id,
        name,
        description,
        category,
        location,
        date: formattedDateLost,
        imagepath: filePath,
        isClaimed,
        claimedby: isClaimed ? claimedBy : null,
        claimeddate: isClaimed ? formattedClaimedDate : null
      };

      const updatedLostItem = await client.models.LostItem.update(
        updateData,
        { authMode: "userPool" }
      );

      console.log("Updated lost item:", updatedLostItem);
      message.success("Lost item updated successfully!");
      setConfirmLoading(false);
      onItemUpdated();
      onCancel();
    } catch (error) {
      console.error("Error updating lost item:", error);
      message.error("Failed to update lost item. Please try again.");
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title="Update Lost Item"
      open={true}
      onOk={form.submit}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Claim Status"
          name="isClaimed"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="Claimed"
            unCheckedChildren="Unclaimed"
            onChange={checked => {
              if (!checked) {
                form.setFieldsValue({
                  claimedBy: null,
                  claimedDate: null
                });
              }
            }}
          />
        </Form.Item>

        {form.getFieldValue('isClaimed') && (
          <>
            <Form.Item
              label="Claimed By"
              name="claimedBy"
              rules={[{ required: true, message: "Please enter claimant's name" }]}
            >
              <Input placeholder="Enter claimant's name or ID" />
            </Form.Item>

            <Form.Item
              label="Claim Date"
              name="claimedDate"
              rules={[{ required: true, message: "Please select claim date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </>
        )}

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
          rules={[{ required: true, message: "Please enter the description" }]}
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
          label="Date Found"
          name="dateLost"
          rules={[{ required: true, message: "Please select the date the item was lost" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Lost Item Image">
          <input type="file" onChange={handleFileChange} accept="image/*" />
          {item.imagePath && (
            <p style={{ marginTop: 8 }}>
              Current Image: <a href={`https://${item.imagePath}`} target="_blank" rel="noopener noreferrer">View</a>
            </p>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateLostItem;