import { Card, Col, Row, DatePicker, Select, Table, Statistic, Tooltip, Tag, Button, Spin, message, Modal, Skeleton } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, SmileOutlined, DownloadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useAppSelector } from '@/redux/hooks';
import dayjs from 'dayjs';
import { callGenerateReport, callGetDepartments, callGetUsers } from '@/config/api';
import '@/styles/reports.module.scss';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

const ReportsPage = () => {
    const user = useAppSelector(state => state.account.user);
    const isAdmin = user?.role?.name === 'SUPER_ADMIN';

    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().startOf('month'),
        dayjs().endOf('month')
    ]);

    const [reportType, setReportType] = useState('attendance');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [departments, setDepartments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
    const [selectedUser, setSelectedUser] = useState<string | undefined>();
    const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
    const [exporting, setExporting] = useState(false);
    const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [detailModal, setDetailModal] = useState<{ visible: boolean, record: any | null }>({ visible: false, record: null });
    const [meta, setMeta] = useState({ current: 1, pageSize: 10, total: 0 });

    useEffect(() => {
        fetchReportData();
        callGetDepartments('').then(res => setDepartments(res?.data?.result || []));
        callGetUsers('').then(res => setUsers(res?.data?.result || []));
    }, [dateRange, reportType]);

    const handleTableChange = (pagination: any) => {
        setMeta(prev => ({
            ...prev,
            current: pagination.current,
            pageSize: pagination.pageSize,
        }));
    };

    useEffect(() => {
        fetchReportData();
        // eslint-disable-next-line
    }, [dateRange, reportType, meta.current, meta.pageSize]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const response = await callGenerateReport({
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD'),
                type: 'custom',
                reportType: reportType as 'attendance' | 'leave',
                current: meta.current,
                pageSize: meta.pageSize,
            });
            setReportData(response.data);
            setMeta({
                current: response.data?.meta?.current || 1,
                pageSize: response.data?.meta?.pageSize || 10,
                total: response.data?.meta?.total || (response.data?.dailyStats ? Object.keys(response.data.dailyStats).length : 0)
            });
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Data cho biểu đồ chấm công theo tháng
    const attendanceChart = {
        series: [{
            name: 'Đúng giờ',
            data: Object.values(reportData?.dailyStats || {}).map((stat: any) => stat.present)
        }, {
            name: 'Đi muộn',
            data: Object.values(reportData?.dailyStats || {}).map((stat: any) => stat.late)
        }],
        options: {
            chart: {
                type: 'bar',
                height: 350,
                stacked: true,
                toolbar: {
                    show: true
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 4,
                    columnWidth: '60%',
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: Object.keys(reportData?.dailyStats || {}),
            },
            title: {
                // text: 'Thống kê chấm công theo tháng',
                align: 'center' as const,
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold'
                }
            },
            colors: ['#52c41a', '#ff4d4f'],
            legend: {
                position: 'bottom' as const
            },
            fill: {
                opacity: 1
            }
        }
    };

    // Data cho bảng chi tiết chấm công (tổng hợp theo ngày)
    const attendanceTableData = Object.entries(reportData?.dailyStats || {}).map(
        ([date, stats]: [string, any], idx) => ({
            key: idx,
            date,
            totalEmployees: stats.totalEmployees ?? reportData?.summary?.totalEmployees ?? 0,
            present: stats.present ?? 0,
            late: stats.late ?? 0,
            onLeave: stats.onLeave ?? 0,
            lateRate: stats.present ? ((stats.late / stats.present) * 100).toFixed(1) : 0,
        })
    );

    // Data cho bảng chi tiết chấm công
    const attendanceColumns = [
        {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Tổng số nhân viên',
            dataIndex: 'totalEmployees',
            key: 'totalEmployees',
        },
        {
            title: 'Có mặt',
            dataIndex: 'present',
            key: 'present',
        },
        {
            title: 'Đi muộn',
            dataIndex: 'late',
            key: 'late',
        },
        {
            title: 'Nghỉ phép',
            dataIndex: 'onLeave',
            key: 'onLeave',
        },
        {
            title: 'Tỷ lệ đi muộn',
            dataIndex: 'lateRate',
            key: 'lateRate',
            render: (rate: number) => (
                <span style={{ color: rate > 10 ? '#ff4d4f' : '#52c41a' }}>
                    {rate}%
                </span>
            )
        }
    ];

    const attendanceData = reportData?.attendanceData || [];

    const handleExportExcel = () => {
        setExporting(true);
        // Xuất Excel từ selectedRows hoặc toàn bộ bảng nếu không chọn dòng nào
        const dataToExport = selectedRows.length > 0 ? selectedRows : (reportType === 'attendance' ? attendanceTableData : reportData?.leaveRequests || []);
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, 'report.xlsx');
        setExporting(false);
        message.success('Xuất Excel thành công!');
    };

    const handleFilter = () => {
        fetchReportData();
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={8}>
                        <Select
                            style={{ width: '100%' }}
                            value={reportType}
                            onChange={setReportType}
                            options={[
                                { value: 'attendance', label: 'Báo cáo chấm công' },
                                { value: 'leave', label: 'Báo cáo nghỉ phép' },
                            ]}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <RangePicker
                            style={{ width: '100%' }}
                            value={dateRange}
                            onChange={(dates) => {
                                if (dates) {
                                    setDateRange([dates[0] as dayjs.Dayjs, dates[1] as dayjs.Dayjs]);
                                }
                            }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExportExcel}>Xuất Excel</Button>
                    </Col>
                </Row>
            </Card>

            {isAdmin && (
                <>
                    {/* Thống kê tổng quan */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        {reportType === 'attendance' ? (
                            <>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card hoverable>
                                        <Statistic
                                            title="Tổng số nhân viên"
                                            value={reportData?.summary?.totalEmployees || 0}
                                            prefix={<TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                                            valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 600 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card hoverable>
                                        <Statistic
                                            title="Tỷ lệ đi muộn trung bình"
                                            value={reportData?.summary?.lateCount || 0}
                                            suffix="ngày"
                                            prefix={<ClockCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />}
                                            valueStyle={{ color: '#ff4d4f', fontSize: '24px', fontWeight: 600 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card hoverable>
                                        <Statistic
                                            title="Tổng số ngày nghỉ phép"
                                            value={reportData?.summary?.totalLeaveDays || 0}
                                            suffix="ngày"
                                            prefix={<CheckCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />}
                                            valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: 600 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card hoverable>
                                        <Statistic
                                            title="Tỷ lệ chấm công trung bình"
                                            value={reportData?.summary?.presentCount || 0}
                                            suffix="%"
                                            prefix={<UserOutlined style={{ fontSize: '24px', color: '#52c41a' }} />}
                                            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 600 }}
                                        />
                                    </Card>
                                </Col>
                            </>
                        ) : (
                            <>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card hoverable>
                                        <Statistic
                                            title="Tổng số đơn nghỉ phép đã duyệt"
                                            value={reportData?.summary?.totalApproved || 0}
                                            prefix={<CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />}
                                            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 600 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card hoverable>
                                        <Statistic
                                            title="Tổng số ngày nghỉ phép"
                                            value={reportData?.summary?.totalLeaveDays || 0}
                                            suffix="ngày"
                                            prefix={<ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />}
                                            valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: 600 }}
                                        />
                                    </Card>
                                </Col>
                            </>
                        )}
                    </Row>

                    {/* Biểu đồ */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col span={24} style={{ marginBottom: 8 }}>
                            <Select
                                style={{ width: 180 }}
                                value={chartType}
                                onChange={setChartType}
                                options={[
                                    { value: 'bar', label: 'Biểu đồ cột' },
                                    { value: 'pie', label: 'Biểu đồ tròn' },
                                    { value: 'line', label: 'Biểu đồ đường' },
                                ]}
                            />
                        </Col>
                        <Col span={24}>
                            <Card title={reportType === 'attendance' ? "Biểu đồ thống kê chấm công" : "Biểu đồ nghỉ phép"}>
                                {reportType === 'attendance' ? (
                                    chartType === 'pie' ? (
                                        <ReactApexChart
                                            key={chartType}
                                            options={{
                                                labels: ['Đúng giờ', 'Đi muộn'],
                                                colors: ['#52c41a', '#ff4d4f'],
                                                legend: { position: 'bottom' as const },
                                                // title: { text: 'Tỷ lệ đúng giờ/đi muộn', align: 'left' as const }
                                            }}
                                            series={[
                                                Object.values(reportData?.dailyStats || {}).reduce((sum: number, stat: any) => sum + (stat.present || 0), 0),
                                                Object.values(reportData?.dailyStats || {}).reduce((sum: number, stat: any) => sum + (stat.late || 0), 0)
                                            ]}
                                            type="pie"
                                            height={350}
                                        />
                                    ) : (
                                        <ReactApexChart
                                            key={chartType}
                                            options={{
                                                ...attendanceChart.options,
                                                chart: { ...attendanceChart.options.chart, type: chartType },
                                            }}
                                            series={attendanceChart.series}
                                            type={chartType}
                                            height={350}
                                        />
                                    )
                                ) : (
                                    chartType === 'pie' ? (
                                        <ReactApexChart
                                            key={chartType}
                                            options={{
                                                labels: reportData?.leaveRequests?.map((r: any) => r.employee?.name || 'Nhân viên'),
                                                colors: ['#faad14', '#52c41a', '#ff4d4f', '#1890ff', '#595959'],
                                                legend: { position: 'bottom' as const },
                                                // title: { text: 'Tỷ lệ ngày nghỉ theo nhân viên', align: 'center' as const }
                                            }}
                                            series={reportData?.leaveRequests?.map((r: any) => (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 3600 * 24) + 1) || []}
                                            type="pie"
                                            height={350}
                                        />
                                    ) : (
                                        <ReactApexChart
                                            key={chartType}
                                            options={{
                                                chart: { type: chartType, height: 350 },
                                                xaxis: { categories: reportData?.leaveRequests?.map((r: any) => r.startDate?.slice(0, 10)) || [] },
                                                // title: { text: 'Số ngày nghỉ phép theo đơn', align: 'center' as const }
                                            }}
                                            series={[{
                                                name: 'Số ngày nghỉ',
                                                data: reportData?.leaveRequests?.map((r: any) => (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 3600 * 24) + 1) || []
                                            }]}
                                            type={chartType}
                                            height={350}
                                        />
                                    )
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Bảng chi tiết */}
                    <Row>
                        <Col span={24}>
                            <Card title={reportType === 'attendance' ? "Chi tiết chấm công" : "Chi tiết nghỉ phép"}>
                                {reportType === 'attendance' ? (
                                    <Table
                                        columns={attendanceColumns}
                                        dataSource={attendanceTableData}
                                        pagination={{
                                            current: meta.current,
                                            pageSize: meta.pageSize,
                                            total: meta.total,
                                            showSizeChanger: true,
                                            pageSizeOptions: ['10', '20', '50', '100'],
                                            showTotal: (total, range) => (<div> {range[0]}-{range[1]} trên {total} hàng</div>),
                                        }}
                                        onChange={handleTableChange}
                                        rowClassName={(record) => record.late > 0 ? 'row-late' : ''}
                                        scroll={{ x: 'max-content' }}
                                        loading={loading}
                                        rowSelection={{
                                            selectedRowKeys: selectedRows.map(r => r.key),
                                            onChange: (_, rows) => setSelectedRows(rows)
                                        }}
                                    // onRow={(record) => ({
                                    //     onClick: () => setDetailModal({ visible: true, record })
                                    // })}
                                    />
                                ) : (
                                    <Table
                                        columns={[
                                            {
                                                title: 'Nhân viên',
                                                dataIndex: ['employee', 'name'],
                                                key: 'employee',
                                                render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>
                                            },
                                            {
                                                title: 'Loại phép',
                                                dataIndex: 'leaveType',
                                                key: 'leaveType',
                                                align: 'center',
                                                render: (type: string) => {
                                                    let color = '#52c41a';
                                                    let icon = <SmileOutlined />;
                                                    let label = 'Khác';
                                                    if (type === 'ANNUAL') { color = '#52c41a'; icon = <SmileOutlined />; label = 'Nghỉ phép năm'; }
                                                    if (type === 'SICK') { color = '#ff4d4f'; icon = <ClockCircleOutlined />; label = 'Nghỉ ốm'; }
                                                    if (type === 'PERSONAL') { color = '#faad14'; icon = <UserOutlined />; label = 'Nghỉ việc riêng'; }
                                                    if (type === 'MATERNITY') { color = '#1890ff'; icon = <TeamOutlined />; label = 'Nghỉ sinh con'; }
                                                    if (type === 'BEREAVEMENT') { color = '#595959'; icon = <CheckCircleOutlined />; label = 'Nghỉ tết'; }
                                                    return <Tag color={color} icon={icon}>{label}</Tag>;
                                                }
                                            },
                                            {
                                                title: 'Từ ngày',
                                                dataIndex: 'startDate',
                                                key: 'startDate',
                                                align: 'center',
                                                render: (date: string) => dayjs(date).format('DD/MM/YYYY')
                                            },
                                            {
                                                title: 'Đến ngày',
                                                dataIndex: 'endDate',
                                                key: 'endDate',
                                                align: 'center',
                                                render: (date: string) => dayjs(date).format('DD/MM/YYYY')
                                            },
                                            {
                                                title: 'Lý do',
                                                dataIndex: 'reason',
                                                key: 'reason',
                                                render: (reason: string) => reason && reason.length > 20 ? (
                                                    <Tooltip title={reason}>{reason.slice(0, 20)}...</Tooltip>
                                                ) : (
                                                    <span>{reason}</span>
                                                )
                                            },
                                        ]}
                                        dataSource={reportData?.leaveRequests?.map((r: any, idx: number) => ({
                                            ...r,
                                            key: idx,
                                        }))}
                                        pagination={{
                                            current: meta.current,
                                            pageSize: meta.pageSize,
                                            total: meta.total,
                                            showSizeChanger: true,
                                            pageSizeOptions: ['10', '20', '50', '100'],
                                            showTotal: (total, range) => (<div> {range[0]}-{range[1]} trên {total} hàng</div>),
                                        }}
                                        onChange={handleTableChange}
                                        rowClassName={() => 'row-leave'}
                                        scroll={{ x: 'max-content' }}
                                        loading={loading}
                                        rowSelection={{
                                            selectedRowKeys: selectedRows.map(r => r.key),
                                            onChange: (_, rows) => setSelectedRows(rows)
                                        }}
                                    // onRow={(record) => ({
                                    //     onClick: () => setDetailModal({ visible: true, record })
                                    // })}
                                    />
                                )}
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
            <Modal
                open={detailModal.visible}
                title={reportType === 'attendance' ? 'Chi tiết chấm công' : 'Chi tiết nghỉ phép'}
                onCancel={() => setDetailModal({ visible: false, record: null })}
                footer={null}
            >
                {detailModal.record ? (
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(detailModal.record, null, 2)}</pre>
                ) : <Skeleton active />}
            </Modal>
        </div>
    );
};

export default ReportsPage; 