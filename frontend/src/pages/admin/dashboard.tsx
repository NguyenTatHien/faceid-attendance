import { Card, Col, Row, Statistic, Typography, Table, Calendar, Progress, Alert, List, Badge } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useAppSelector } from '@/redux/hooks';
import dayjs from 'dayjs';
import { callGetDashboard, callGetMyAttendance } from '@/config/api';

const { Title } = Typography;

const DashboardPage = () => {
    const user = useAppSelector(state => state.account.user);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [myAttendance, setMyAttendance] = useState<any>(null);
    const [dashboardDataNew, setDashboardDataNew] = useState<any>(null);
    const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const res = await callGetDashboard();
                setDashboardDataNew(res.data);
                setMyAttendance(res.data.myAttendance.result[0]);
            } catch (error: any) {
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (dashboardDataNew?.myAttendance?.result) {
            setRecentAttendance(dashboardDataNew.myAttendance.result.slice(0, 5));
        }
    }, [dashboardDataNew]);

    const isAdmin = user?.role?.name === 'SUPER_ADMIN';
    const isManager = user?.role?.name === 'MANAGER';

    // Mock data - sau này sẽ lấy từ API
    const dashboardData = {
        totalEmployees: dashboardDataNew?.totalCustomer,
        presentToday: dashboardDataNew?.presentToday,
        onLeave: dashboardDataNew?.totalLeaveRequest,
        lateToday: dashboardDataNew?.lateToday,
        currentShift: {
            name: myAttendance?.userShift,
            time: dayjs(myAttendance?.userShiftId?.startTime).format('HH:mm') + ' - ' + dayjs(myAttendance?.userShiftId?.endTime).format('HH:mm'),
            activeEmployees: 95
        },
        nextShift: {
            name: myAttendance?.userShift,
            time: dayjs(myAttendance?.userShiftId?.startTime).format('HH:mm') + ' - ' + dayjs(myAttendance?.userShiftId?.endTime).format('HH:mm'),
            activeEmployees: 45
        },
        myAttendance: {
            checkIn: myAttendance?.checkInTime ? dayjs(myAttendance?.checkInTime).format('HH:mm') : '',
            checkOut: myAttendance?.checkOutTime ? dayjs(myAttendance?.checkOutTime).format('HH:mm') : '',
            status: myAttendance?.status === 'on-time' ? 'Đúng giờ' : myAttendance?.status === 'late' ? 'Đi muộn' : 'Chưa chấm công',
            lateMinutes: myAttendance?.lateMinutes
        }
    };

    // Cảnh báo đi muộn
    const lateWarning = dashboardData.myAttendance.lateMinutes > 0;
    // Nhắc nhở check-in/check-out
    const notCheckedIn = !dashboardData.myAttendance.checkIn;
    const notCheckedOut = !dashboardData.myAttendance.checkOut;

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: '24px', color: '#1890ff' }}>
                Thông tin chấm công của tôi
            </Title>

            {/* Cảnh báo và nhắc nhở */}
            {lateWarning && (
                <Alert
                    message="Bạn đã đi muộn hôm nay! Hãy chú ý thời gian đi làm."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
            {notCheckedIn && (
                <Alert
                    message="Bạn chưa check-in hôm nay!"
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
            {notCheckedOut && dashboardData.myAttendance.checkIn && (
                <Alert
                    message="Bạn chưa check-out hôm nay!"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Thông tin chấm công cá nhân */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Giờ vào</span>}
                            value={dashboardData.myAttendance.checkIn || '-'}
                            prefix={<ClockCircleOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Giờ ra</span>}
                            value={dashboardData.myAttendance.checkOut || '-'}
                            prefix={<ClockCircleOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Trạng thái</span>}
                            value={dashboardData.myAttendance.status}
                            prefix={<CheckCircleOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{
                                color: dashboardData.myAttendance.lateMinutes > 0 ? '#ff4d4f' : '#52c41a',
                                fontSize: '24px'
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Ca làm việc</span>}
                            value={dashboardData.currentShift.name || '-'}
                            prefix={<CalendarOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Lịch sử chấm công gần đây */}
            <Card title="Lịch sử chấm công gần đây" style={{ marginBottom: 24 }}>
                <List
                    itemLayout="horizontal"
                    dataSource={recentAttendance}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                title={<span>{dayjs(item.checkInTime).format('DD/MM/YYYY')}</span>}
                                description={
                                    <>
                                        <Badge color={item.status === 'late' ? 'red' : 'green'} text={item.status === 'late' ? 'Đi muộn' : 'Đúng giờ'} />
                                        {item.lateMinutes > 0 && (
                                            <span style={{ marginLeft: 8, color: '#ff4d4f' }}>
                                                (Muộn {item.lateMinutes} phút)
                                            </span>
                                        )}
                                        <span style={{ marginLeft: 16 }}>
                                            Check-in: {item.checkInTime ? dayjs(item.checkInTime).format('HH:mm') : '-'}
                                        </span>
                                        <span style={{ marginLeft: 16 }}>
                                            Check-out: {item.checkOutTime ? dayjs(item.checkOutTime).format('HH:mm') : '-'}
                                        </span>
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
}

export default DashboardPage;