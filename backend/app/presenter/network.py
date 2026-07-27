"""Works out which addresses the phone can reach this laptop on.

Needed because the browser can't discover its own machine's LAN address, and
the whole point of the remote is that it runs on a different device.
"""

from __future__ import annotations

import ipaddress
import socket


def _via_default_route() -> str | None:
    """The address of whichever interface carries the default route.

    Opening a UDP socket sends nothing — connect() on UDP just makes the OS
    pick a route — so this works with no internet at all. On a phone hotspot
    or USB tether the default route points at the phone, which is exactly
    the interface we want.
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return None
    finally:
        sock.close()


def _via_hostname() -> list[str]:
    """Fallback for when there's no default route at all."""
    try:
        hostname = socket.gethostname()
        return socket.gethostbyname_ex(hostname)[2]
    except OSError:
        return []


def _is_reachable(address: str) -> bool:
    """Keep private and link-local addresses; drop loopback and anything odd."""
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False
    if ip.is_loopback or ip.is_multicast or ip.is_unspecified:
        return False
    return ip.is_private or ip.is_link_local


def local_addresses() -> list[str]:
    """Candidate addresses, best guess first."""
    found: list[str] = []

    primary = _via_default_route()
    if primary and _is_reachable(primary):
        found.append(primary)

    for address in _via_hostname():
        if _is_reachable(address) and address not in found:
            found.append(address)

    return found


def local_hostname() -> str:
    """e.g. 'ibaze.local' — sometimes works where a bare IP doesn't."""
    try:
        name = socket.gethostname()
    except OSError:
        return ""
    return name if "." in name else f"{name}.local"