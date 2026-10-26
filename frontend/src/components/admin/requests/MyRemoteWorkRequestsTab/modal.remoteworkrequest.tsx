import { Modal, Form, DatePicker, Input, Button, message, notification } from "antd";
import { useState } from "react";
import { callCreateRemoteWorkRequest, callUpdateRemoteWorkRequest } from "@/config/api";
import { IRemoteWorkRequest } from "@/types/backend";
import { CloseOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import { useAppSelector } from "@/redux/hooks";

const { RangePicker } = DatePicker;

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IRemoteWorkRequest | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalRemoteWorkRequest = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const currentUser = useAppSelector(state => state.account.user);

    const handleFinish = async (values: any) => {
        const { dateRange, reason, workLocation, workPlan } = values;
        const start = dayjs(dateRange?.[0]);
        const end = dayjs(dateRange?.[1]);
        if (!start.isValid() || !end.isValid()) {
            message.error('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc hợp lệ!');
            return;
        }
        const remoteWorkRequest: IRemoteWorkRequest = {
            _id: dataInit?._id || '',
            employee: {
                _id: currentUser._id,
                name: currentUser.name,
                employeeCode: currentUser.email
            },
            workLocation,
            startDate: start.format('YYYY-MM-DD'),
            endDate: end.format('YYYY-MM-DD'),
            reason,
            workPlan,
            status: 'PENDING',
            approvedAt: dataInit?.approvedAt || '',
            approvedBy: dataInit?.approvedBy || undefined
        };
        try {
            setLoading(true);
            if (dataInit?._id) {
                const res = await callUpdateRemoteWorkRequest(dataInit._id, remoteWorkRequest);
                if (res.data) {
                    message.success("Cập nhật đơn làm việc từ xa thành công");
                    handleReset();
                    reloadTable();
                }
            } else {
                const res = await callCreateRemoteWorkRequest(remoteWorkRequest);
                if (res.data) {
                    message.success("Tạo mới đơn làm việc từ xa thành công");
                    handleReset();
                    reloadTable();
                }
            }
        } catch (error: any) {
            notification.error({
                message: "Có lỗi xảy ra",
                description: error.response?.data?.message || error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    return (
        <Modal
            open={openModal}
            onCancel={handleReset}
            footer={null}
            title={dataInit?._id ? "Cập nhật đơn làm việc từ xa" : "Tạo mới đơn làm việc từ xa"}
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                    workLocation: dataInit?.workLocation,
                    dateRange: dataInit?.startDate && dataInit?.endDate ? [dayjs(dataInit.startDate), dayjs(dataInit.endDate)] : undefined,
                    reason: dataInit?.reason,
                    workPlan: dataInit?.workPlan
                }}
            >
                <Form.Item
                    name="workLocation"
                    label="Địa điểm làm việc"
                    rules={[{ required: true, message: 'Vui lòng nhập địa điểm làm việc!' }]}
                >
                    <Input placeholder="Nhập địa điểm làm việc" />
                </Form.Item>
                <Form.Item
                    name="dateRange"
                    label="Thời gian làm việc từ xa"
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian làm việc từ xa!' }]}
                >
                    <RangePicker
                        format="YYYY-MM-DD"
                        style={{ width: '100%' }}
                        getPopupContainer={trigger => (trigger.parentNode as HTMLElement) || document.body}
                    // disabledDate={(current: any) => current && current < dayjs().endOf('day')}
                    />
                </Form.Item>
                <Form.Item
                    name="reason"
                    label="Lý do"
                    rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
                >
                    <Input.TextArea placeholder="Nhập lý do làm việc từ xa" rows={3} />
                </Form.Item>
                <Form.Item
                    name="workPlan"
                    label="Kế hoạch công việc"
                    rules={[{ required: true, message: 'Vui lòng nhập kế hoạch công việc!' }]}
                >
                    <Input.TextArea placeholder="Nhập kế hoạch công việc" rows={3} />
                </Form.Item>
                <Form.Item>
                    <Button onClick={handleReset} icon={<CloseOutlined />} style={{ marginRight: 8 }}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={loading} icon={dataInit?._id ? <SaveOutlined /> : <PlusOutlined />}>
                        {dataInit?._id ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalRemoteWorkRequest; 