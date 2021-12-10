/**
 *    SPDX-License-Identifier: Apache-2.0
 */
import actions from './actions';
import { get } from '../../../services/request';

/* istanbul ignore next */
const blockList = channel => dispatch =>
	get(`/apiLedger/blockAndTxList/${channel}/0`)
		.then(resp => {
			if (resp.status === 500) {
				dispatch(
					actions.getErroMessage(
						'500 Internal Server Error: The server has encountered an internal error and unable to complete your request'
					)
				);
			} else if (resp.status === 400) {
				dispatch(actions.getErroMessage(resp.error));
			} else {
				dispatch(actions.getBlockList(resp));
			}
		})
		.catch(error => {
			console.error(error);
		});
const blockListSearch = (channel, query) => dispatch =>
	get(`/apiLedger/blockAndTxList/${channel}/0?${query}`)
		.then(resp => {
			dispatch(actions.getBlockListSearch(resp));
		})
		.catch(error => {
			console.error(error);
		});

/* istanbul ignore next */
const chaincodeList = channel => dispatch =>
	get(`/apiLedger/chaincode/${channel}`)
		.then(resp => {
			if (resp.status === 500) {
				dispatch(
					actions.getErroMessage(
						'500 Internal Server Error: The server has encountered an internal error and unable to complete your request'
					)
				);
			} else if (resp.status === 400) {
				dispatch(actions.getErroMessage(resp.error));
			} else {
				dispatch(actions.getChaincodeList(resp));
			}
		})
		.catch(error => {
			console.error(error);
		});

// table channel

/* istanbul ignore next */
const channels = () => dispatch =>
	get('/apiLedger/channels/info')
		.then(resp => {
			if (resp.status === 500) {
				dispatch(
					actions.getErroMessage(
						'500 Internal Server Error: The server has encountered an internal error and unable to complete your request'
					)
				);
			} else if (resp.status === 400) {
				dispatch(actions.getErroMessage(resp.error));
			} else {
				dispatch(actions.getChannels(resp));
			}
		})
		.catch(error => {
			console.error(error);
		});

/* istanbul ignore next */
const peerList = channel => dispatch =>
	get(`/apiLedger/peersStatus/${channel}`)
		.then(resp => {
			if (resp.status === 500) {
				dispatch(
					actions.getErroMessage(
						'500 Internal Server Error: The server has encountered an internal error and unable to complete your request'
					)
				);
			} else if (resp.status === 400) {
				dispatch(actions.getErroMessage(resp.error));
			} else {
				dispatch(actions.getPeerList(resp));
			}
		})
		.catch(error => {
			console.error(error);
		});

/* istanbul ignore next */
const transaction = (channel, transactionId) => dispatch =>
	get(`/apiLedger/transaction/${channel}/${transactionId}`)
		.then(resp => {
			if (resp.status === 500) {
				dispatch(
					actions.getErroMessage(
						'500 Internal Server Error: The server has encountered an internal error and unable to complete your request'
					)
				);
			} else if (resp.status === 400) {
				dispatch(actions.getErroMessage(resp.error));
			} else {
				dispatch(actions.getTransaction(resp));
			}
		})
		.catch(error => {
			console.error(error);
		});

const transactionListSearch = (channel, query) => dispatch =>
	get(`/apiLedger/txList/${channel}/0/0?${query}`)
		.then(resp => {
			dispatch(actions.getTransactionListSearch(resp));
		})
		.catch(error => {
			console.error(error);
		});

/* istanbul ignore next */
const transactionList = channel => dispatch =>
	get(`/apiLedger/txList/${channel}/0/0/`)
		.then(resp => {
			if (resp.status === 500) {
				dispatch(
					actions.getErroMessage(
						'500 Internal Server Error: The server has encountered an internal error and unable to complete your request'
					)
				);
			} else if (resp.status === 400) {
				dispatch(actions.getErroMessage(resp.error));
			} else {
				dispatch(actions.getTransactionList(resp));
			}
		})
		.catch(error => {
			console.error(error);
		});
export default {
	blockList,
	chaincodeList,
	channels,
	peerList,
	transaction,
	transactionList,
	transactionListSearch,
	blockListSearch
};
