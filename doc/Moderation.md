# Moderation

One might want to attack the platform to create fake ballots, get the result of
a vote early or snoop in to get a specific ballot value. Here are a few possible
scenarios:
* attempting to authenticate using an invalid JWT;
* attempting to push a ballot for a vote when there is an existing ballot for
the same user/vote;
* attempting to push a ballot transaction for a smart contract that doesn't
match with the target vote;
* attempting to push a ballot transaction calling another smart contract method
than `Vote.vote()`.

All of those attempts will lead to unsuccessful requests with ` 401`, `403` or
`300` HTTP response codes. Even if those attempts are unsuccessful, they lead to
unnecessary resource consumption and they are a potential security threat. Thus,
they must be blocked.

## Automated IP blacklisting

The platform will log  suspicious requests and the corresponding IP. **If the
same IP makes too many suspicious attempts, _all_ its traffic will be
automatically blocked by updating `iptables` directly.**

All the IP addresses logged by the platform are available in the admin UI on the
`/admin/ipaddresses` page.

## Manual IP blacklisting

The `/admin/ipaddresses` admin page can be used to manually remove an IP address
from the blacklist:

* navigate to `/admin/ipaddresses`;
* select the IP address record you want to remove from the blacklist;
* make sure the "blacklisted" checkbox is not checked and click "Save".

## Automated IP whitelisting

Some IPs (such as `127.0.0.1`) are automatically whitelisted upon provisioning.
This list can be changed by editing the `whitelisted_ips` Ansible fact.

## Manual IP whitelisting

To make sure some specific IPs are not blacklisted by mistake, they can be
manually whitelisted:

* by using the `/admin/ipaddresses` admin page to create/update the
corresponding IP address record making sure the "whitelisted" checkbox is
checked;
* or by calling the `/api/scripts/whitelist-ip.js` script (ex:
`./whitelist-ip.js --ip=127.0.0.1`).
