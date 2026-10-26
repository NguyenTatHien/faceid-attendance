import React, { useRef, useState } from 'react';
import { Input, message, notification, Popconfirm, Space } from 'antd';
import { IRemoteWorkRequest } from '@/types/backend';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callUpdateRemoteWorkRequestStatus } from '@/config/api';
import queryString from 'query-string';
import DataTable from '@/components/share/data-table';
import dayjs from 'dayjs';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { fetchRemoteWorkRequests } from '@/redux/slice/requestRemoteWorkSlide';

const RemoteWorkRequestsTab: React.FC = () => {
    const [rejectReason, setRejectReason] = useState<string>('');
    const tableRef = useRef<ActionType>();
    const dispatch = useAppDispatch();
    const isFetching = useAppSelector(state => state.remoteWorkRequests.isFetching);
    const meta = useAppSelector(state => state.remoteWorkRequests.meta);
    const requests = useAppSelector(state => state.remoteWorkRequests.result);

    const handleApprove = async (id: string) => {
        try {
            const res = await callUpdateRemoteWorkRequestStatus(id, {
                status: 'APPROVED',
                approvedBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!)._id : ''
            });
            if (res.data) {
                message.success('Duyệt đơn làm việc từ xa thành công');
                reloadTable();
            }
        } catch (error: any) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: error.response?.data?.message || error.message
            });
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectReason) {
            message.error('Vui lòng nhập lý do từ chối');
            return;
        }
        try {
            const res = await callUpdateRemoteWorkRequestStatus(id, {
                status: 'REJECTED',
                rejectionReason: rejectReason
            });
            if (res.data) {
                message.success('Từ chối đơn làm việc từ xa thành công');
                setRejectReason('');
                reloadTable();
            }
        } catch (error: any) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: error.response?.data?.message || error.message
            });
        }
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const columns: ProColumns<IRemoteWorkRequest>[] = [
        {
            title: 'Mã nhân viên',
            dataIndex: ['employee', 'employeeCode'],
            key: 'employeeCode',
        },
        {
            title: 'Nhân viên',
            dataIndex: ['employee', 'name'],
            search: false,
            key: 'employee',
        },
        {
            title: 'Từ ngày',
            dataIndex: 'startDate',
            key: 'startDate',
            search: false,
            render: (text, record) => dayjs(record.startDate).format('DD/MM/YYYY'),
        },
        {
            title: 'Đến ngày',
            dataIndex: 'endDate',
            key: 'endDate',
            search: false,
            render: (text, record) => dayjs(record.endDate).format('DD/MM/YYYY'),
        },
        {
            title: 'Địa điểm',
            dataIndex: 'workLocation',
            key: 'workLocation',
            search: false,
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            search: false,
            ellipsis: true
        },
        {
            title: 'Kế hoạch',
            dataIndex: 'workPlan',
            key: 'workPlan',
            search: false,
            ellipsis: true
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            valueEnum: {
                PENDING: { text: 'Chờ duyệt', status: 'Processing' },
                APPROVED: { text: 'Đã duyệt', status: 'Success' },
                REJECTED: { text: 'Từ chối', status: 'Error' },
                CANCELLED: { text: 'Đã hủy', status: 'Default' }
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            search: false,
            render: (_: any, record: IRemoteWorkRequest) => {
                if (record.status !== 'PENDING') return null;
                return (
                    <div>
                        <Space>
                            <Popconfirm
                                title="Xác nhận duyệt đơn"
                                onConfirm={() => handleApprove(record._id)}
                                okText="Xác nhận"
                                cancelText="Hủy"
                            // getPopupContainer={trigger => trigger.parentNode as HTMLElement}
                            >
                                <CheckOutlined
                                    style={{
                                        fontSize: 20,
                                        color: '#52c41a',
                                        cursor: 'pointer',
                                        marginRight: 10
                                    }}
                                />
                            </Popconfirm>
                        </Space>
                        <Space>
                            <Popconfirm
                                title="Xác nhận từ chối đơn"
                                description={
                                    <Input.TextArea
                                        placeholder="Nhập lý do từ chối"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        style={{ marginTop: 10 }}
                                    />
                                }
                                onConfirm={() => handleReject(record._id)}
                                okText="Xác nhận"
                                cancelText="Hủy"
                            // getPopupContainer={trigger => trigger.parentNode as HTMLElement}
                            >
                                <CloseOutlined
                                    style={{
                                        fontSize: 20,
                                        color: '#ff4d4f',
                                        cursor: 'pointer'
                                    }}
                                />
                            </Popconfirm>
                        </Space>
                    </div>
                );
            },
        },
    ];

    const buildQuery = (params: any, sort: any, filter: any) => {
        const clone = { ...params };
        if (clone.name) clone.name = `/${clone.name}/i`;
        if (clone.email) clone.email = `/${clone.email}/i`;

        let temp = queryString.stringify(clone);

        let sortBy = "";
        if (sort && sort.name) {
            sortBy = sort.name === 'ascend' ? "sort=name" : "sort=-name";
        }
        if (sort && sort.email) {
            sortBy = sort.email === 'ascend' ? "sort=email" : "sort=-email";
        }
        if (sort && sort.createdAt) {
            sortBy = sort.createdAt === 'ascend' ? "sort=createdAt" : "sort=-createdAt";
        }
        if (sort && sort.updatedAt) {
            sortBy = sort.updatedAt === 'ascend' ? "sort=updatedAt" : "sort=-updatedAt";
        }

        //mặc định sort theo updatedAt
        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=-updatedAt`;
        } else {
            temp = `${temp}&${sortBy}`;
        }
        temp += "&populate=role&fields=role._id, role.name";

        return temp;
    }

    return (
        <div>
            <DataTable
                actionRef={tableRef}
                columns={columns as any}
                dataSource={requests}
                loading={isFetching}
                rowKey="_id"
                scroll={{ x: 'max-content' }}
                search={{
                    labelWidth: 'auto',
                    defaultCollapsed: true,
                    layout: 'vertical',
                    span: {
                        xs: 24,
                        sm: 12,
                        md: 8,
                        lg: 6,
                        xl: 6,
                        xxl: 6
                    },
                }}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    showTotal: (total: number, range: number[]) => { return (<div> {range[0]}-{range[1]} trên {total} hàng</div>) }
                }}
                request={async (params, sort, filter): Promise<any> => {
                    const query = buildQuery(params, sort, filter);
                    dispatch(fetchRemoteWorkRequests({ query }))
                }}
            />
        </div>
    );
};

export default RemoteWorkRequestsTab; 