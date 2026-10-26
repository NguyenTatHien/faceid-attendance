import {
  Action,
  configureStore,
  ThunkAction,
} from '@reduxjs/toolkit';
import accountReducer from './slice/accountSlide';
import userReducer from './slice/userSlide';
import permissionReducer from './slice/permissionSlide';
import roleReducer from './slice/roleSlide';
import companyReducer from './slice/companySlide';
import departmentReducer from './slice/departmentSlide';
import remoteWorkRequestsReducer from './slice/requestRemoteWorkSlide';
import leaveRequestsSlide from './slice/requestLeaveSlide';
import myRemoteWorkRequestsReducer from './slice/myRequestRemoteWorkSlide';
import myLeaveRequestsReducer from './slice/myRequestLeaveSlide';
export const store = configureStore({
  reducer: {
    account: accountReducer,
    user: userReducer,
    permission: permissionReducer,
    role: roleReducer,
    company: companyReducer,
    department: departmentReducer,
    remoteWorkRequests: remoteWorkRequestsReducer,
    leaveRequests: leaveRequestsSlide,
    myRemoteWorkRequests: myRemoteWorkRequestsReducer,
    myLeaveRequests: myLeaveRequestsReducer
  },
});


export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;