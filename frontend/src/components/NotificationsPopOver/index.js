import React, { useState, useRef, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import openSocket from "../../services/socket-io";
import useSound from "use-sound";
import { toast } from "react-toastify";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Badge from "@material-ui/core/Badge";
import ChatIcon from "@material-ui/icons/Chat";
import { Avatar, Box, Typography } from "@material-ui/core";

import TicketListItem from "../TicketListItem";
import { i18n } from "../../translate/i18n";
import useTickets from "../../hooks/useTickets";
import alertSound from "../../assets/sound.mp3";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles(theme => ({
	tabContainer: {
		overflowY: "auto",
		maxHeight: 420,
		padding: theme.spacing(0.5),
		...theme.scrollbarStyles,
	},
	popoverPaper: {
		width: "100%",
		maxWidth: 380,
		marginLeft: theme.spacing(2),
		marginRight: theme.spacing(1),
		marginTop: theme.spacing(0.5),
		borderRadius: 14,
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: theme.palette.type === "dark"
			? "0 14px 34px rgba(0,0,0,0.45)"
			: "0 14px 34px rgba(15,23,42,0.14)",
		backgroundColor: theme.palette.background.paper,
		[theme.breakpoints.down("sm")]: {
			maxWidth: "calc(100vw - 16px)",
			marginLeft: theme.spacing(1),
			marginRight: theme.spacing(1),
			borderRadius: 12,
		},
	},
	noShadow: {
		boxShadow: "none !important",
	},
	iconButton: {
		color: theme.palette.text.primary,
	},
	notificationTicket: {
		display: "block",
		width: "100%",
		borderRadius: 10,
		overflow: "hidden",
		"& .MuiListItem-root": {
			borderRadius: 10,
		},
		"& .MuiListItem-button:hover": {
			backgroundColor: theme.palette.action.hover,
		},
		"& .MuiListItem-button:focus-visible": {
			boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
		},
	},
	toastCard: {
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		gap: 12,
		padding: "10px 12px",
		minWidth: 300,
		maxWidth: 400,
		borderRadius: 16,
		outline: "none",
		borderLeft: `3px solid ${theme.palette.primary.main}`,
		background: theme.palette.type === "dark"
			? "linear-gradient(180deg, rgba(36,39,46,0.96), rgba(26,29,36,0.96))"
			: "linear-gradient(180deg, #ffffff, #f4f7ff)",
		"&:focus-visible": {
			boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
		},
		"&:hover": {
			transform: "translateY(-1px)",
			boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
		},
		[theme.breakpoints.down("xs")]: {
			minWidth: 250,
			maxWidth: "calc(100vw - 20px)",
			padding: "9px 10px",
			gap: 10,
		},
	},
	toastAvatarWrap: {
		position: "relative",
		flex: "none",
	},
	toastAvatar: {
		width: 44,
		height: 44,
		boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
	},
	toastDot: {
		position: "absolute",
		right: -2,
		top: -1,
		width: 10,
		height: 10,
		borderRadius: "50%",
		background: theme.palette.error.main,
		border: `2px solid ${theme.palette.background.paper}`,
	},
	toastContent: {
		display: "flex",
		flexDirection: "column",
		minWidth: 0,
		flex: 1,
	},
	toastHeader: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
		marginBottom: 2,
	},
	toastTitle: {
		fontWeight: 700,
		lineHeight: 1.2,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	toastTime: {
		color: theme.palette.text.secondary,
		whiteSpace: "nowrap",
		fontWeight: 500,
		fontSize: 11,
	},
	toastMessage: {
		color: theme.palette.text.secondary,
		overflow: "hidden",
		textOverflow: "ellipsis",
		display: "-webkit-box",
		WebkitLineClamp: 2,
		WebkitBoxOrient: "vertical",
		lineHeight: "1.3em",
	},
}));

const NotificationToast = ({ ticket, message, contact, history, classes }) => {
	const handleToastClick = () => {
		history.push(`/tickets/${ticket.id}`);
		window.focus();
	};

	const timeLabel = message?.createdAt
		? format(new Date(message.createdAt), "HH:mm")
		: format(new Date(), "HH:mm");

	return (
		<Box
			onClick={handleToastClick}
			onKeyDown={e => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleToastClick();
				}
			}}
			role="button"
			tabIndex={0}
			aria-label={`Abrir conversa com ${contact.name || "contato"}`}
			className={classes.toastCard}
		>
			<Box className={classes.toastAvatarWrap}>
				<Avatar src={contact.profilePicUrl} alt={contact.name} className={classes.toastAvatar} />
				<Box className={classes.toastDot} />
			</Box>

			<Box className={classes.toastContent}>
				<Box className={classes.toastHeader}>
					<Typography variant="body1" className={classes.toastTitle}>
						{contact.name || "Contato"}
					</Typography>
					<Typography variant="caption" className={classes.toastTime}>
						{timeLabel}
					</Typography>
				</Box>

				<Typography variant="body2" className={classes.toastMessage}>
					{message.body}
				</Typography>
			</Box>
		</Box>
	);
};

const NotificationsPopOver = () => {
	const classes = useStyles();
	const theme = useTheme();

	const history = useHistory();
	const { user } = useContext(AuthContext);
	const ticketIdUrl = +history.location.pathname.split("/")[2];
	const ticketIdRef = useRef(ticketIdUrl);
	const anchorEl = useRef();
	const [isOpen, setIsOpen] = useState(false);
	const [notifications, setNotifications] = useState([]);

	const [, setDesktopNotifications] = useState([]);

	const { tickets } = useTickets({ withUnreadMessages: "true" });
	const [play] = useSound(alertSound);
	const soundAlertRef = useRef();

	const historyRef = useRef(history);

	useEffect(() => {
		soundAlertRef.current = play;

		if (!("Notification" in window)) {
			console.log("This browser doesn't support notifications");
		} else {
			Notification.requestPermission();
		}
	}, [play]);

	useEffect(() => {
		setNotifications(tickets);
	}, [tickets]);

	useEffect(() => {
		ticketIdRef.current = ticketIdUrl;
	}, [ticketIdUrl]);

	useEffect(() => {
		const socket = openSocket();
		if (!socket) return;

		socket.on("connect", () => socket.emit("joinNotification"));

		socket.on("ticket", data => {
			if (data.action === "updateUnread" || data.action === "delete") {
				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticketId);
					if (ticketIndex !== -1) {
						prevState.splice(ticketIndex, 1);
						return [...prevState];
					}
					return prevState;
				});

				setDesktopNotifications(prevState => {
					const notfiticationIndex = prevState.findIndex(
						n => n.tag === String(data.ticketId)
					);
					if (notfiticationIndex !== -1) {
						prevState[notfiticationIndex].close();
						prevState.splice(notfiticationIndex, 1);
						return [...prevState];
					}
					return prevState;
				});
			}
		});

		socket.on("appMessage", data => {
			if (
				data.action === "create" &&
				!data.message.read &&
				(data.ticket.userId === user?.id || !data.ticket.userId)
			) {
				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticket.id);
					if (ticketIndex !== -1) {
						prevState[ticketIndex] = data.ticket;
						return [...prevState];
					}
					return [data.ticket, ...prevState];
				});

				const shouldNotNotificate =
					(data.message.ticketId === ticketIdRef.current &&
						document.visibilityState === "visible") ||
					(data.ticket.userId && data.ticket.userId !== user?.id) ||
					data.ticket.isGroup;

				if (shouldNotNotificate) return;

				handleNotifications(data);
			}
		});

		return () => {
			socket.disconnect();
		};
	}, [user, theme]);

	const handleNotifications = data => {
		const { message, contact, ticket } = data;

		const options = {
			body: `${message.body} - ${format(new Date(), "HH:mm")}`,
			icon: contact.profilePicUrl,
			tag: ticket.id,
			renotify: true,
		};

		const notification = new Notification(
			`${i18n.t("tickets.notification.message")} ${contact.name}`,
			options
		);

		notification.onclick = e => {
			e.preventDefault();
			window.focus();
			historyRef.current.push(`/tickets/${ticket.id}`);
		};

		setDesktopNotifications(prevState => {
			const notfiticationIndex = prevState.findIndex(
				n => n.tag === notification.tag
			);
			if (notfiticationIndex !== -1) {
				prevState[notfiticationIndex] = notification;
				return [...prevState];
			}
			return [notification, ...prevState];
		});

		soundAlertRef.current();

		toast(<NotificationToast ticket={ticket} message={message} contact={contact} history={historyRef.current} classes={classes} />, {
			position: "top-right",
			autoClose: 6500,
			hideProgressBar: true,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			style: {
				background: "transparent",
				color: theme.palette.text.primary,
				borderRadius: 16,
				padding: 0,
				boxShadow: "0 10px 22px rgba(0,0,0,0.14)",
				border: "none",
			}
		});
	};

	const handleClick = () => {
		setIsOpen(prevState => !prevState);
	};

	const handleClickAway = () => {
		setIsOpen(false);
	};

	const NotificationTicket = ({ children }) => {
		return (
			<Box onClick={handleClickAway} className={classes.notificationTicket}>
				{children}
			</Box>
		);
	};

	return (
		<>
			<IconButton
				onClick={handleClick}
				ref={anchorEl}
				aria-label="Open Notifications"
				className={classes.iconButton}
			>
				<Badge badgeContent={notifications.length} color="secondary" overlap="rectangle">
					<ChatIcon />
				</Badge>
			</IconButton>
			<Popover
				disableScrollLock
				open={isOpen}
				anchorEl={anchorEl.current}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				classes={{ paper: classes.popoverPaper }}
				onClose={handleClickAway}
			>
				<List dense className={classes.tabContainer}>
					{notifications.length === 0 ? (
						<ListItem>
							<ListItemText>{i18n.t("notifications.noTickets")}</ListItemText>
						</ListItem>
					) : (
						notifications.map(ticket => (
							<NotificationTicket key={ticket.id}>
								<TicketListItem ticket={ticket} />
							</NotificationTicket>
						))
					)}
					{/* TEMPORARY TEST BUTTON REMOVED */}
				</List>
			</Popover>
		</>
	);
};

export default NotificationsPopOver;
