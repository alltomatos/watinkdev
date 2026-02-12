import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default,
  HasMany,
  ForeignKey,
  BelongsTo,
  DataType,
  BelongsToMany,
  AfterCreate,
  AfterUpdate,
  AfterDestroy
} from "sequelize-typescript";
import ContactCustomField from "./ContactCustomField";
import Ticket from "./Ticket";
import Tenant from "./Tenant";
import Client from "./Client";
import ClientContact from "./ClientContact";
import User from "./User";
import Tag from "./Tag";
import EntityTag from "./EntityTag";
import ContactAudit from "./ContactAudit";
import context from "../libs/context";

@Table
class Contact extends Model<Contact> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @AllowNull(true)
  @Default(null)
  @Column
  number: string;

  @AllowNull(true)
  @Default(null)
  @Unique
  @Column
  lid: string;

  @AllowNull(false)
  @Default("")
  @Column
  email: string;

  @Column
  profilePicUrl: string;

  @Default(false)
  @Column
  isGroup: boolean;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column
  walletUserId: number;

  @BelongsTo(() => User, "walletUserId")
  walletUser: User;

  @ForeignKey(() => Tenant)
  @Column(DataType.UUID)
  tenantId: number | string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @HasMany(() => ContactCustomField)
  extraInfo: ContactCustomField[];

  @BelongsToMany(() => Client, () => ClientContact)
  clients: Client[];

  @BelongsToMany(() => Tag, {
    through: {
      model: () => EntityTag,
      scope: {
        entityType: "contact"
      }
    },
    foreignKey: "entityId",
    otherKey: "tagId",
    constraints: false
  })
  tags: Tag[];

  @AfterCreate
  static async logCreate(instance: Contact, options: any) {
    const ctx = context.getStore();
    await ContactAudit.create(
      {
        tenantId: instance.tenantId,
        contactId: instance.id,
        userId: ctx?.userId as any,
        action: "create",
        nextData: instance.toJSON()
      },
      { transaction: options.transaction }
    );
  }

  @AfterUpdate
  static async logUpdate(instance: Contact, options: any) {
    const ctx = context.getStore();
    const changed = instance.changed();
    const previousData = {};
    if (changed) {
      (changed as string[]).forEach((field) => {
        previousData[field] = (instance as any).previous(field);
      });
    }
    await ContactAudit.create(
      {
        tenantId: instance.tenantId,
        contactId: instance.id,
        userId: ctx?.userId as any,
        action: "update",
        previousData,
        nextData: instance.toJSON()
      },
      { transaction: options.transaction }
    );
  }

  @AfterDestroy
  static async logDestroy(instance: Contact, options: any) {
    const ctx = context.getStore();
    await ContactAudit.create(
      {
        tenantId: instance.tenantId,
        contactId: instance.id,
        userId: ctx?.userId as any,
        action: "delete",
        previousData: instance.toJSON()
      },
      { transaction: options.transaction }
    );
  }
}

export default Contact;
