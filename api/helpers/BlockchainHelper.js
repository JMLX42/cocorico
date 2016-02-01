
exports.whenTransactionMined = function(web3, tx, callback)
{
    var check = setInterval(
        function()
        {
            web3.eth.getTransaction(
                tx,
                function(e, r)
                {
                    if (e || (r && r.blockHash))
                    {
                        clearInterval(check);
                        callback(e, r);
                    }
                }
            );
        },
        1000
    );
}
