const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        organizationId: req.organizationId,
        userId: req.user.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        organizationId: req.organizationId,
        userId: req.user.id,
        isRead: false,
      },
    });

    return success(res, 'Notifications retrieved', {
      notifications,
      unreadCount,
    });
  } catch (err) {
    return error(res, 'Failed to fetch notifications', err.message, 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await prisma.notification.updateMany({
        where: {
          organizationId: req.organizationId,
          userId: req.user.id,
          isRead: false,
        },
        data: { isRead: true },
      });
      return success(res, 'All notifications marked as read');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return success(res, 'Notification marked as read', updated);
  } catch (err) {
    return error(res, 'Failed to mark notification', err.message, 500);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
