import React, { useState } from 'react';
import { Button, Form, Input, Modal, Select, message, Avatar, Typography } from 'antd';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { MailOutlined } from '@ant-design/icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from "../../amplify/data/resource";

// Client for API calls
const client = generateClient<Schema>();

const { Title } = Typography;

const ProfilePage: React.FC = () => {
    const [subscribeLoading, setSubscribeLoading] = useState(false);
    const [category, setCategory] = useState<string>('');
    const [showCustomCategory, setShowCustomCategory] = useState(false); // To toggle custom category input
    const [isModalVisible, setIsModalVisible] = useState(false); // For controlling modal visibility
    const { user } = useAuthenticator((context) => [context.user]);
    const loginId = user?.signInDetails?.loginId;

    // Function to handle subscription
    const handleSubscribe = async () => {
        if (!loginId) {
            message.error('You must be logged in to subscribe!');
            return;
        }

        if (!category && category !== '') { // Allow empty string as valid
            message.error('Please select or enter a category!');
            return;
        }

        setSubscribeLoading(true);
        try {
            const response = await client.mutations.subscribe(
                { email: loginId, category },
                { authMode: 'userPool' }
            );
            console.log("sending subscribe request with", loginId, category);
            if (response) {
                message.success('For first-time subscription, please verify email. Else, subscription change was successful!');
                setIsModalVisible(false); // Close the modal upon success
            } else {
                throw new Error('Subscription response was empty.');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            message.error('Failed to subscribe. Please try again later.');
        } finally {
            setSubscribeLoading(false);
        }
    };

    const handleCategoryChange = (value: string) => {
        if (value === 'Other') {
            setShowCustomCategory(true);
            setCategory(''); // Clear field if 'Other' is selected
        } else {
            setCategory(value || ''); // If the value is empty, set it as an empty string
            setShowCustomCategory(false);
        }
    };

    const resetCategory = () => {
        setShowCustomCategory(false);
        setCategory('');
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* Profile Section */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <Avatar size={64} style={{ marginRight: '20px' }}>
                    {loginId ? loginId.charAt(0).toUpperCase() : <MailOutlined />}
                </Avatar>
                <div>
                    <Title level={2}>Profile</Title>
                    <p>{loginId ? `Login ID: ${loginId}` : 'Not logged in'}</p>
                </div>
            </div>

            {/* Subscribe Button */}
            <Button
                type="primary"
                icon={<MailOutlined />}
                onClick={() => setIsModalVisible(true)}
            >
                Subscribe to Notifications
            </Button>

            <Modal
                title="Subscribe to Notifications"
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={subscribeLoading}
                        onClick={handleSubscribe}
                    >
                        Confirm Subscription
                    </Button>,
                ]}
            >
                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ message: 'Please select or enter a category' }]}
                >
                    {showCustomCategory ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Input
                                placeholder="Enter custom category"
                                value={category} // Bind value to category state
                                onChange={(e) => setCategory(e.target.value)}
                            />
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
                            value={category || undefined} // Ensure it handles '' as an empty string
                        >
                            <Select.Option value="">All Category</Select.Option>
                            <Select.Option value="Electronics">Electronics</Select.Option>
                            <Select.Option value="Clothing">Clothing</Select.Option>
                            <Select.Option value="Documents">Documents</Select.Option>
                            <Select.Option value="Jewelry">Jewelry</Select.Option>
                            <Select.Option value="Other">Other (Specify)</Select.Option>
                        </Select>
                    )}
                </Form.Item>
            </Modal>
        </div>
    );
};

export default ProfilePage;
