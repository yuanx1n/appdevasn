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
    Tag,
} from 'antd';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import type { Schema } from "../../amplify/data/resource";
import { fetchAuthSession } from 'aws-amplify/auth';

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
    const [categoryTags, setCategoryTags] = useState<string[]>([]); // Track the tags for filtering

    const updateColSpan = () => {
        const width = window.innerWidth;
        if (width < 576) setColSpan(24);
        else if (width < 768) setColSpan(12);
        else if (width < 992) setColSpan(8);
        else setColSpan(6);
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
        refreshList();
        window.addEventListener('resize', updateColSpan);
        return () => window.removeEventListener('resize', updateColSpan);
    }, []);

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
    
            // Category tags filter (Match any tag, not necessarily all)
            const categoryMatch = categoryTags.length === 0 || categoryTags.some(tag => 
                item.category.toLowerCase().includes(tag.toLowerCase())
            );
    
            return statusMatch && searchMatch && categoryMatch;
        });
    
        setFilteredItems(filtered);
    }, [searchTerm, statusFilter, allItems, categoryTags]);
    

    const handleCategoryTagAdd = (value: string) => {
        if (value && !categoryTags.includes(value)) {
            setCategoryTags([...categoryTags, value]);
        }
        setSearchTerm(''); // Clear the search term after adding a tag
    };

    const handleCategoryTagRemove = (tag: string) => {
        setCategoryTags(categoryTags.filter(t => t !== tag));
    };

    const descriptionStyle = {
        display: '-webkit-box',
        webkitBoxOrient: 'vertical',
        overflow: 'hidden',
        webkitLineClamp: 2,
        height: '40px',
    };

    const claimItem = async (item: any) => {
        const currentDate = new Date().toISOString().split('T')[0];
        const authSession = await fetchAuthSession();
        const userId = authSession.tokens?.idToken?.payload.sub;
        try {
            await client.models.LostItem.update(
                {
                    id: item.id,
                    isClaimed: true,
                    claimedby: userId,
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
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <Search
                            placeholder="Search categories with tags"
                            onSearch={handleCategoryTagAdd}
                            style={{ width: 200 }}
                        />
                        <div>
                            {categoryTags.map((tag) => (
                                <Tag
                                    key={tag}
                                    closable
                                    onClose={() => handleCategoryTagRemove(tag)}
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </div>
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
            
            <Footer style={{ textAlign: 'center' }}>
                Lost & Found ©{new Date().getFullYear()} Created by Yuanxin
            </Footer>
        </Layout>
    );
};

export default HomePage;
