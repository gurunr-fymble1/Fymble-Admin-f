import RoleBasedLayout from "../components/RoleBasedLayout";

export default function AdminLayout({ children }) {
  return <RoleBasedLayout>{children}</RoleBasedLayout>;
}
