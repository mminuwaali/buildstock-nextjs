import {
  inviteDemoUser,
  listDevices,
  listUsers,
  registerDemoDevice,
} from "@/libraries/mock-api/repository";
import type {
  InviteUserType,
  RegisterDeviceType,
} from "@/features/users/schema";

export function getUsers(branchId?: string) {
  return listUsers(branchId);
}

export function getDevices(branchId?: string) {
  return listDevices(branchId);
}

export function inviteUser(payload: InviteUserType) {
  return inviteDemoUser(payload);
}

export function registerDevice(payload: RegisterDeviceType) {
  return registerDemoDevice(payload);
}
