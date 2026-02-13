import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import {
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from "@material-ui/core";
import { MoreVert, Replay, PlayArrow } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { toast } from "react-toastify";

const useStyles = makeStyles(theme => ({
	actionButtons: {
		marginRight: 6,
		flex: "none",
		alignSelf: "center",
		marginLeft: "auto",
		"& > *": {
			margin: theme.spacing(1),
		},
	},
	premiumButton: {
		position: "relative",
		borderRadius: 20,
		textTransform: "none",
		fontWeight: 600,
		boxShadow: "none",
		"&:hover": {
			boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
		},
	},
}));

const TicketActionButtons = ({ ticket }) => {
	const classes = useStyles();
	const history = useHistory();
	const [anchorEl, setAnchorEl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [manualFlowModalOpen, setManualFlowModalOpen] = useState(false);
	const [flows, setFlows] = useState([]);
	const [selectedFlowId, setSelectedFlowId] = useState("");
	const [startingFlow, setStartingFlow] = useState(false);
	const ticketOptionsMenuOpen = Boolean(anchorEl);
	const { user } = useContext(AuthContext);

	useEffect(() => {
		if (!manualFlowModalOpen) return;
		const loadFlows = async () => {
			try {
				const { data } = await api.get("/flows");
				const activeFlows = (data || []).filter(flow => flow.isActive);
				setFlows(activeFlows);
				if (activeFlows.length > 0) {
					setSelectedFlowId(String(activeFlows[0].id));
				}
			} catch (err) {
				toastError(err);
			}
		};
		loadFlows();
	}, [manualFlowModalOpen]);

	const handleOpenTicketOptionsMenu = e => {
		setAnchorEl(e.currentTarget);
	};

	const handleCloseTicketOptionsMenu = e => {
		setAnchorEl(null);
	};

	const handleUpdateTicketStatus = async (e, status, userId) => {
		setLoading(true);
		try {
			await api.put(`/tickets/${ticket.id}`, {
				status: status,
				userId: userId || null,
			});

			setLoading(false);
			if (status === "open") {
				history.push(`/tickets/${ticket.id}`);
			} else {
				history.push("/tickets");
			}
		} catch (err) {
			setLoading(false);
			toastError(err);
		}
	};

	const handleStartManualFlow = async () => {
		if (!selectedFlowId) return;
		setStartingFlow(true);
		try {
			await api.post(`/tickets/${ticket.id}/flows/${selectedFlowId}/start`);
			toast.success("Fluxo iniciado com sucesso.");
			setManualFlowModalOpen(false);
		} catch (err) {
			toastError(err);
		} finally {
			setStartingFlow(false);
		}
	};

	return (
		<div className={classes.actionButtons}>
			{ticket.status === "closed" && (
				<ButtonWithSpinner
					className={classes.premiumButton}
					loading={loading}
					startIcon={<Replay />}
					size="small"
					onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
				>
					{i18n.t("messagesList.header.buttons.reopen")}
				</ButtonWithSpinner>
			)}
			{ticket.status === "open" && (
				<>
					<Button
						className={classes.premiumButton}
						startIcon={<PlayArrow />}
						size="small"
						variant="outlined"
						onClick={() => setManualFlowModalOpen(true)}
					>
						Iniciar Fluxo
					</Button>
					<ButtonWithSpinner
						className={classes.premiumButton}
						loading={loading}
						startIcon={<Replay />}
						size="small"
						onClick={e => handleUpdateTicketStatus(e, "pending", null)}
					>
						{i18n.t("messagesList.header.buttons.return")}
					</ButtonWithSpinner>
					<ButtonWithSpinner
						className={classes.premiumButton}
						loading={loading}
						size="small"
						variant="contained"
						color="primary"
						onClick={e => handleUpdateTicketStatus(e, "closed", user?.id)}
					>
						{i18n.t("messagesList.header.buttons.resolve")}
					</ButtonWithSpinner>
					<IconButton onClick={handleOpenTicketOptionsMenu}>
						<MoreVert />
					</IconButton>
					<TicketOptionsMenu
						ticket={ticket}
						anchorEl={anchorEl}
						menuOpen={ticketOptionsMenuOpen}
						handleClose={handleCloseTicketOptionsMenu}
					/>
				</>
			)}
			{ticket.status === "pending" && (
				<ButtonWithSpinner
					className={classes.premiumButton}
					loading={loading}
					size="small"
					variant="contained"
					color="primary"
					onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
				>
					{i18n.t("messagesList.header.buttons.accept")}
				</ButtonWithSpinner>
			)}

			<Dialog open={manualFlowModalOpen} onClose={() => setManualFlowModalOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle>Iniciar Fluxo</DialogTitle>
				<DialogContent>
					<FormControl fullWidth variant="outlined" margin="dense">
						<InputLabel id="flow-select-label">Fluxo ativo</InputLabel>
						<Select
							labelId="flow-select-label"
							value={selectedFlowId}
							onChange={e => setSelectedFlowId(e.target.value)}
							label="Fluxo ativo"
						>
							{flows.map(flow => (
								<MenuItem key={flow.id} value={String(flow.id)}>{flow.name}</MenuItem>
							))}
						</Select>
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setManualFlowModalOpen(false)} disabled={startingFlow}>Cancelar</Button>
					<Button color="primary" variant="contained" onClick={handleStartManualFlow} disabled={!selectedFlowId || startingFlow}>
						Iniciar
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default TicketActionButtons;
