"use client";

import { FmzTenantContentFrame } from '../../../../components/layout';
import MaintenanceBase from "../components/maintenance/MaintenanceBase";

export default function MaintenancePage() {
  return (
    <FmzTenantContentFrame>
      <MaintenanceBase isAdminView={false} />
    </FmzTenantContentFrame>
  );
}