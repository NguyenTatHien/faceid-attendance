import { Modal, Form, DatePicker, Input, Select, Button, message, notification } from "antd";
import { useState } from "react";
import { callCreateLeaveRequest, callUpdateLeaveRequest } from "@/config/api";
import { ILeaveRequest } from "@/types/backend";
import { CloseOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import { useAppSelector } from "@/redux/hooks";

const { RangePicker } = DatePicker;

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ILeaveRequest | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalLeaveRequest = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const currentUser = useAppSelector(state => state.account.user);

    const handleFinish = async (values: any) => {
        const { dateRange, reason, leaveType } = values;
        const start = dayjs(dateRange?.[0]);
        const end = dayjs(dateRange?.[1]);
        if (!start.isValid() || !end.isValid()) {
            message.error('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc hợp lệ!');
            return;
        }
        const leaveRequest: ILeaveRequest = {
            _id: dataInit?._id || '',
            employee: {
                _id: currentUser._id,
                name: currentUser.name,
                employeeCode: currentUser.email
            },
            startDate: start.format('YYYY-MM-DD'),
            endDate: end.format('YYYY-MM-DD'),
            reason,
            leaveType,
            status: 'PENDING',
            approvedAt: dataInit?.approvedAt || ''
        };
        try {
            setLoading(true);
            if (dataInit?._id) {
                const res = await callUpdateLeaveRequest(dataInit._id, leaveRequest);
                if (res.data) {
                    message.success("Cập nhật đơn xin nghỉ phép thành công");
                    handleReset();
                    reloadTable();
                }
            } else {
                const res = await callCreateLeaveRequest(leaveRequest);
                if (res.data) {
                    message.success("Tạo mới đơn xin nghỉ phép thành công");
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
            title={dataInit?._id ? "Cập nhật đơn xin nghỉ phép" : "Tạo mới đơn xin nghỉ phép"}
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                    leaveType: dataInit?.leaveType,
                    dateRange: dataInit?.startDate && dataInit?.endDate ? [dayjs(dataInit.startDate), dayjs(dataInit.endDate)] : undefined,
                    reason: dataInit?.reason
                }}
            >
                <Form.Item
                    name="leaveType"
                    label="Loại nghỉ phép"
                    rules={[{ required: true, message: 'Vui lòng chọn loại nghỉ phép!' }]}
                >
                    <Select placeholder="Chọn loại nghỉ phép">
                        <Select.Option value="SICK">Nghỉ ốm</Select.Option>
                        <Select.Option value="ANNUAL">Nghỉ phép năm</Select.Option>
                        <Select.Option value="PERSONAL">Nghỉ việc riêng</Select.Option>
                        <Select.Option value="MATERNITY">Nghỉ sinh con</Select.Option>
                        <Select.Option value="BEREAVEMENT">Nghỉ tết</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    name="dateRange"
                    label="Thời gian nghỉ phép"
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian nghỉ phép!' }]}
                >
                    <RangePicker
                        format="YYYY-MM-DD"
                        style={{ width: '100%' }}
                    // disabledDate={(current: any) => current && current < dayjs().endOf('day')}
                    />
                </Form.Item>
                <Form.Item
                    name="reason"
                    label="Lý do"
                    rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
                >
                    <Input.TextArea placeholder="Nhập lý do nghỉ phép" rows={3} />
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

export default ModalLeaveRequest; 