import React, { useState, useEffect } from 'react';
import {
    Breadcrumb,
    Layout,
    theme,
    Card,
    Col,
    Row,
    Avatar,
    Pagination,
    Input,
    Button,
    message,
    Select,
    Form,
    Modal
} from 'antd';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import type { Schema } from "../../amplify/data/resource";
import { fetchAuthSession } from 'aws-amplify/auth';
// Add these imports at the top
import { useAuthenticator } from '@aws-amplify/ui-react';
import { MailOutlined } from '@ant-design/icons';



const { Meta } = Card;
const { Content, Footer } = Layout;
const { Search } = Input;

const client = generateClient<Schema>();

const defaultAvatar = 'https://api.dicebear.com/7.x/miniavs/svg?seed=defaultAvatar';
const defaultCover = 'https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png';

const HomePage: React.FC = () => {
    const [allItems, setAllItems] = useState<any[]>([]);
    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [colSpan, setColSpan] = useState(6);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');
    // Inside the HomePage component, before the return statement:
    const { user } = useAuthenticator((context) => [context.user]);
    const loginId = user?.signInDetails?.loginId;
    const [subscribeLoading, setSubscribeLoading] = useState(false);
    const [showCustomCategory, setShowCustomCategory] = useState(false); // To toggle custom category input
    const [form] = Form.useForm(); // Form instance to control input field
    const [category, setCategory] = useState<string>(''); // Category state
    const [isModalVisible, setIsModalVisible] = useState(false); // For controlling modal visibility

    
    const updateColSpan = () => {
        const width = window.innerWidth;
        if (width < 576) setColSpan(24);
        else if (width < 768) setColSpan(12);
        else if (width < 992) setColSpan(8);
        else setColSpan(6);
    };
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
                message.success('For First time subscription, please verify email. Else Subscription change was successful!');
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
        form.setFieldsValue({ category: undefined });
    };


    const refreshList = async () => {
        setLoading(true);
        try {
            const response = await client.models.LostItem.list({ authMode: 'userPool' });
            setAllItems(response.data);
            setFilteredItems(response.data);
        } catch (error) {
            console.error('Error fetching lost items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        const filtered = allItems.filter(item => {
            // Status filter
            const statusMatch = statusFilter === 'all' || 
                (statusFilter === 'claimed' && item.isClaimed) ||
                (statusFilter === 'unclaimed' && !item.isClaimed);
            
            // Search term filter
            const searchMatch = lowerSearchTerm === '' ||
                item.name.toLowerCase().includes(lowerSearchTerm) ||
                item.description.toLowerCase().includes(lowerSearchTerm);

            return statusMatch && searchMatch;
        });

        setFilteredItems(filtered);
    }, [searchTerm, statusFilter, allItems]);

    useEffect(() => {
        refreshList();
        window.addEventListener('resize', updateColSpan);
        return () => window.removeEventListener('resize', updateColSpan);
    }, []);

    const descriptionStyle = {
        display: '-webkit-box',
        webkitBoxOrient: 'vertical',
        overflow: 'hidden',
        webkitLineClamp: 2,
        height: '40px',
    };

    // Function to claim an item
    const claimItem = async (item: any) => {
        const currentDate = new Date().toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format
        // Get current user's ID from Cognito
        const authSession = await fetchAuthSession();
        const userId = authSession.tokens?.idToken?.payload.sub; // Correct path
        try {
            await client.models.LostItem.update(
                {
                  id: item.id,
                  isClaimed: true,
                  claimedby: userId, // Replace with actual user
                  claimeddate: currentDate,
                  
                },
                { authMode: "userPool" }
            );
            message.success(`Item "${item.name}" claimed successfully!`);
            refreshList();
        } catch (error) {
            console.error('Error claiming item:', error);
            message.error('Failed to claim item.');
        }
    };

    return (
        <Layout>
            <Content style={{ padding: '0 48px' }}>
                <Breadcrumb style={{ margin: '16px 0' }}>
                    <h2>Lost Items</h2>
                </Breadcrumb>
                <div
                    style={{
                        padding: 20,
                        background: theme.useToken().token.colorBgContainer,
                        borderRadius: theme.useToken().token.borderRadiusLG,
                    }}
                >
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                        <Search
                            placeholder="Search by name or description"
                            allowClear
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: 300 }}
                        />
                        <Select
                            defaultValue="all"
                            style={{ width: 200 }}
                            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
                            options={[
                                { value: 'all', label: 'Show All Items' },
                                { value: 'unclaimed', label: 'Unclaimed Items Only' },
                                { value: 'claimed', label: 'Claimed Items Only' },
                            ]}
                        />
                       <Button
                            type="primary"
                            icon={<MailOutlined />}
                            onClick={() => setIsModalVisible(true)}


                        >
                            Subscribe to Notifications
                        </Button>
                    </div>

                    <Row gutter={[40, 40]}>
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            filteredItems.map((item) => (
                                <Col span={colSpan} key={item.id}>
                                    <Card
                                        style={{ width: 250, height: 350 }}
                                        cover={
                                            <StorageImage
                                                alt={item.name}
                                                path={item.imagepath || defaultCover}
                                                style={{ width: '100%', height: '150px', objectFit: 'contain' }}
                                            />
                                        }
                                    >
                                        <Link to={`/itemdetailspage/${item.id}`}>
                                            <Meta
                                                avatar={<Avatar src={item.avatar || defaultAvatar} />}
                                                title={item.name}
                                                description={<div style={descriptionStyle}>{item.description}</div>}
                                            />
                                        </Link>
                                        {!item.isClaimed ? (
                                            <Button 
                                                type="primary" 
                                                block 
                                                style={{ marginTop: 10 }}
                                                onClick={() => claimItem(item)}
                                            >
                                                Claim Item
                                            </Button>
                                        ) : (
                                            <Button 
                                                type="dashed" 
                                                block 
                                                disabled 
                                                style={{ marginTop: 10 }}
                                            >
                                                Already claimed 
                                            </Button>
                                        )}
                                    </Card>
                                </Col>
                            ))
                        )}
                    </Row>
                    <Pagination 
                        align="center" 
                        defaultCurrent={1} 
                        total={filteredItems.length} 
                        pageSize={12}
                        style={{ marginTop: 24 }}
                    />
                </div>
            </Content>
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
                    rules={[{ message: 'Please select or enter a category' }]}>
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
                            onChange={(value) => handleCategoryChange(value)}
                            value={category || undefined} // Ensure it handles '' as an empty string
                        >
                            <Select.Option value="">No Category</Select.Option> {/* Add option for no category */}
                            <Select.Option value="Electronics">Electronics</Select.Option>
                            <Select.Option value="Clothing">Clothing</Select.Option>
                            <Select.Option value="Documents">Documents</Select.Option>
                            <Select.Option value="Jewelry">Jewelry</Select.Option>
                            <Select.Option value="Other">Other (Specify)</Select.Option>
                        </Select>
                    )}
                </Form.Item>

            </Modal>
            <Footer style={{ textAlign: 'center' }}>
                Lost & Found ©{new Date().getFullYear()} Created by Yuanxin
            </Footer>
        </Layout>
    );
};

export default HomePage;