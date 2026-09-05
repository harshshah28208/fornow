const prisma = require('../config/db');

const sendNotification = async ({
  organizationId,
  userId,
  title,
  message,
  type = 'INFO',
  entityType = null,
  entityId = null,
}) => {
  try {
    return await prisma.notification.create({
      data: {
        organizationId,
        userId,
        title,
        message,
        type,
        entityType,
        entityId: entityId ? String(entityId) : null,
      },
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
    return null;
  }
};

const notifyRole = async ({
  organizationId,
  role,
  title,
  message,
  type = 'INFO',
  entityType = null,
  entityId = null,
}) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        role,
        isActive: true,
      },
    });

    const notifications = await Promise.all(
      users.map((user) =>
        sendNotification({
          organizationId,
          userId: user.id,
          title,
          message,
          type,
          entityType,
          entityId,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error(`Failed to notify role ${role}:`, error);
    return [];
  }
};

module.exports = {
  sendNotification,
  notifyRole,
};
