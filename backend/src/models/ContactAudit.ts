import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  AllowNull
} from "sequelize-typescript";
import Contact from "./Contact";
import User from "./User";
import Tenant from "./Tenant";

@Table({ tableName: "ContactAudits" })
class ContactAudit extends Model<ContactAudit> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @AllowNull(false)
  @Column(DataType.UUID)
  tenantId: string | number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column(DataType.STRING)
  action: string; // create/update/delete

  @Column(DataType.JSONB)
  previousData: any;

  @Column(DataType.JSONB)
  nextData: any;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ContactAudit;
