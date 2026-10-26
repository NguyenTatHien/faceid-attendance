import React, { useEffect, useRef, useState } from 'react';
import { Table, Tag, Button, Modal, message, notification, Popconfirm } from 'antd';
import { ILeaveRequest } from '@/types/backend';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callDeleteLeaveRequest } from '@/config/api';
import queryString from 'query-string';
import DataTable from '@/components/share/data-table';
import ModalLeaveRequest from './modal.leaverequest';
import dayjs from 'dayjs';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { fetchMyLeaveRequests } from '@/redux/slice/myRequestLeaveSlide';

const MyLeaveRequestsTab = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<ILeaveRequest | null>(null);
    const [openViewModal, setOpenViewModal] = useState<boolean>(false);
    const actionRef = useRef<ActionType>();
    const currentUser = useAppSelector(state => state.account.user);
    const dispatch = useAppDispatch();
    const requests = useAppSelector((state: any) => state.myLeaveRequests?.result || []);
    const meta = useAppSelector((state: any) => state.myLeaveRequests?.meta || {});
    const isFetching = useAppSelector((state: any) => state.myLeaveRequests?.isFetching || false);

    const handleDelete = async (id: string) => {
        try {
            const res = await callDeleteLeaveRequest(id);
            if (res.data) {
                message.success("Xóa đơn xin nghỉ phép thành công");
                reloadTable();
            }
        } catch (error: any) {
            notification.error({
                message: "Có lỗi xảy ra",
                description: error.response?.data?.message || error.message
            });
        }
    };

    const columns: ProColumns<ILeaveRequest>[] = [
        {
            title: 'Loại nghỉ phép',
            dataIndex: 'leaveType',
            valueEnum: {
                ANNUAL: { text: 'Nghỉ phép năm', status: 'Default' },
                SICK: { text: 'Nghỉ ốm', status: 'Warning' },
                PERSONAL: { text: 'Nghỉ việc riêng', status: 'Processing' },
                MATERNITY: { text: 'Nghỉ sinh con', status: 'Default' },
                BEREAVEMENT: { text: 'Nghỉ tết', status: 'Default' }
            }
        },
        {
            title: 'Thời gian',
            dataIndex: 'startDate',
            render: (_, record) => {
                return `${dayjs(record.startDate).format('DD/MM/YYYY')} - ${dayjs(record.endDate).format('DD/MM/YYYY')}`;
            }
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            ellipsis: true
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            valueEnum: {
                PENDING: { text: 'Chờ duyệt', status: 'Processing' },
                APPROVED: { text: 'Đã duyệt', status: 'Success' },
                REJECTED: { text: 'Từ chối', status: 'Error' },
                CANCELLED: { text: 'Đã hủy', status: 'Default' }
            }
        },
        {
            title: 'Người duyệt',
            dataIndex: 'approvedBy',
            render: (_, record) => record.approvedBy?.name || '-'
        },
        {
            title: 'Thời gian duyệt',
            dataIndex: 'approvedAt',
            render: (_, record) => record.approvedAt ? dayjs(record.approvedAt).format('DD/MM/YYYY HH:mm') : '-'
        },
        {
            title: 'Thao tác',
            valueType: 'option',
            render: (_: any, record: any) => [
                <Button
                    key="view"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setDataInit(record);
                        setOpenViewModal(true);
                    }}
                />,
                record.status === 'PENDING' && (
                    <>
                        {/* <Button
                            key="edit"
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setDataInit(record);
                                setOpenModal(true);
                            }}
                        /> */}
                        <Popconfirm
                            title="Xác nhận xóa?"
                            onConfirm={() => handleDelete(record._id)}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button
                                key="delete"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Popconfirm>
                    </>
                )
            ]
        }
    ];

    const buildQuery = (params: any, sort: any, filter: any) => {
        const clone = { ...params };
        if (currentUser._id) {
            clone.employee = currentUser._id;
        }
        if (clone.startDate) clone.startDate = dayjs(clone.startDate).format('YYYY-MM-DD');
        if (clone.endDate) clone.endDate = dayjs(clone.endDate).format('YYYY-MM-DD');
        let temp = queryString.stringify(clone);
        let sortBy = sort?.startDate === 'ascend' ? 'sort=startDate' : sort?.startDate === 'descend' ? 'sort=-startDate' : '';
        temp = `${temp}&${sortBy}`;
        return temp;
    };

    const reloadTable = () => {
        actionRef.current?.reload();
    };

    return (
        <div>
            <DataTable<ILeaveRequest>
                actionRef={actionRef}
                rowKey="_id"
                headerTitle="Danh sách đơn xin nghỉ phép"
                toolBarRender={() => [
                    <Button
                        icon={<PlusOutlined />}
                        type="primary"
                        onClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                    >
                        Thêm mới
                    </Button>
                ]}
                request={async (params, sort, filter) => {
                    const query = buildQuery(params, sort, filter);
                    dispatch(fetchMyLeaveRequests({ query }));
                }}
                scroll={{ x: 'max-content' }}
                columns={columns}
                dataSource={requests}
                loading={isFetching}
                search={{
                    labelWidth: 120,
                }}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    showTotal: (total: number, range: number[]) => { return (<div> {range[0]}-{range[1]} trên {total} hàng</div>) }
                }}
            />

            <ModalLeaveRequest
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={reloadTable}
            />

            <Modal
                title="Chi tiết đơn xin nghỉ phép"
                open={openViewModal}
                onCancel={() => {
                    setOpenViewModal(false);
                    setDataInit(null);
                }}
                footer={null}
                width={800}
            >
                {dataInit && (
                    <div>
                        <p><strong>Loại nghỉ phép:</strong> {
                            dataInit.leaveType === 'ANNUAL' ? 'Nghỉ phép năm' :
                                dataInit.leaveType === 'SICK' ? 'Nghỉ ốm' :
                                    dataInit.leaveType === 'PERSONAL' ? 'Nghỉ việc riêng' :
                                        dataInit.leaveType === 'MATERNITY' ? 'Nghỉ sinh con' :
                                            dataInit.leaveType === 'BEREAVEMENT' ? 'Nghỉ tết' : 'Khác'
                        }</p>
                        <p><strong>Thời gian:</strong> {dayjs(dataInit.startDate).format('DD/MM/YYYY')} - {dayjs(dataInit.endDate).format('DD/MM/YYYY')}</p>
                        <p><strong>Lý do:</strong> {dataInit.reason}</p>
                        <p><strong>Trạng thái:</strong> {
                            dataInit.status === 'PENDING' ? 'Chờ duyệt' :
                                dataInit.status === 'APPROVED' ? 'Đã duyệt' :
                                    dataInit.status === 'REJECTED' ? 'Từ chối' : 'Đã hủy'
                        }</p>
                        {dataInit.approvedBy && (
                            <p><strong>Người duyệt:</strong> {dataInit.approvedBy.name}</p>
                        )}
                        {dataInit.approvedAt && (
                            <p><strong>Thời gian duyệt:</strong> {dayjs(dataInit.approvedAt).format('DD/MM/YYYY HH:mm')}</p>
                        )}
                        {dataInit.status === 'REJECTED' && dataInit.rejectionReason && (
                            <p><strong>Lý do từ chối:</strong> {dataInit.rejectionReason}</p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyLeaveRequestsTab; 